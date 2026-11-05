import { normalizeAvatarId } from '../data/avatarCatalog';
import { isFirebaseConfigured } from './firebaseSettings';

const LOCAL_STORAGE_PLAYER_ID_KEY = 'codebase_player_id';
const LOCAL_STORAGE_NICKNAME_KEY = 'codebase_player_nickname';

const FUN_ADJECTIVES = ['Swift', 'Clever', 'Brave', 'Cosmic', 'Solar', 'Atomic', 'Cyber', 'Neon', 'Stealth', 'Hyper'];
const FUN_NOUNS = ['Ace', 'Coder', 'Knight', 'Wizard', 'Falcon', 'Viper', 'Oracle', 'Ranger', 'Titan', 'Spark'];

export function generateRandomNickname(): string {
  const adj = FUN_ADJECTIVES[Math.floor(Math.random() * FUN_ADJECTIVES.length)];
  const noun = FUN_NOUNS[Math.floor(Math.random() * FUN_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
}

export interface PlayerIdentity {
  id: string;
  nickname: string;
  avatarId: string;
}

class AuthService {
  private currentIdentity: PlayerIdentity;
  private cloudReady: Promise<void> | null = null;
  private listeners: Set<(identity: PlayerIdentity) => void> = new Set();

  constructor() {
    let savedId = localStorage.getItem(LOCAL_STORAGE_PLAYER_ID_KEY);
    if (!savedId) {
      savedId = 'ply_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(LOCAL_STORAGE_PLAYER_ID_KEY, savedId);
    }

    let savedNickname = localStorage.getItem(LOCAL_STORAGE_NICKNAME_KEY);
    if (!savedNickname) {
      savedNickname = generateRandomNickname();
      localStorage.setItem(LOCAL_STORAGE_NICKNAME_KEY, savedNickname);
    }

    this.currentIdentity = {
      id: savedId,
      nickname: savedNickname,
      avatarId: normalizeAvatarId(localStorage.getItem('court_avatar_id') ?? undefined, savedId),
    };

    // Remove the retired local-table preference. Every table uses Firebase.
    localStorage.removeItem('codebase_force_simulator');
    void this.connect().catch(() => {});
  }

  private connect(): Promise<void> {
    return this.cloudReady ??= this.initializeCloudAuth().catch(error => { this.cloudReady = null; throw error; });
  }

  private async initializeCloudAuth(): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Online tables are not configured yet.');
    const [{ auth }, { onAuthStateChanged, signInAnonymously }] = await Promise.all([
      import('./firebaseConfig'), import('firebase/auth'),
    ]);
    if (!auth) throw new Error('Couldn’t connect to online tables. Try again.');
    const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
    this.currentIdentity = { ...this.currentIdentity, id: user.uid };
    localStorage.setItem(LOCAL_STORAGE_PLAYER_ID_KEY, user.uid);
    this.notify();
    onAuthStateChanged(auth, fresh => {
      if (fresh && fresh.uid !== this.currentIdentity.id) {
        this.currentIdentity = { ...this.currentIdentity, id: fresh.uid };
        localStorage.setItem(LOCAL_STORAGE_PLAYER_ID_KEY, fresh.uid);
        this.notify();
      }
    });
  }

  public async getOnlineIdentity(): Promise<PlayerIdentity> {
    try { await this.connect(); return this.getIdentity(); }
    catch { throw new Error('Couldn’t connect. Check your internet and try again.'); }
  }

  public getIdentity(): PlayerIdentity {
    return { ...this.currentIdentity };
  }

  public setNickname(newNickname: string): void {
    const trimmed = newNickname.trim().slice(0, 20);
    if (!trimmed) return;
    this.currentIdentity = {
      ...this.currentIdentity,
      nickname: trimmed,
    };
    localStorage.setItem(LOCAL_STORAGE_NICKNAME_KEY, trimmed);
    this.notify();
  }

  public setAvatar(avatarId: string): void {
    const selected = normalizeAvatarId(avatarId, this.currentIdentity.id);
    this.currentIdentity = { ...this.currentIdentity, avatarId: selected };
    localStorage.setItem('court_avatar_id', selected);
    this.notify();
  }

  public subscribe(callback: (identity: PlayerIdentity) => void): () => void {
    this.listeners.add(callback);
    callback(this.getIdentity());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    const id = this.getIdentity();
    this.listeners.forEach((cb) => cb(id));
  }
}

export const authService = new AuthService();
