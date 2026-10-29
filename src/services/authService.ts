import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig';

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
}

class AuthService {
  private currentIdentity: PlayerIdentity;
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
    };

    // If live Firebase Auth is available, synchronize with anonymous auth
    if (isFirebaseConfigured() && auth) {
      const activeAuth = auth;
      onAuthStateChanged(activeAuth, (user: User | null) => {
        if (user) {
          this.currentIdentity = {
            id: user.uid,
            nickname: this.currentIdentity.nickname,
          };
          localStorage.setItem(LOCAL_STORAGE_PLAYER_ID_KEY, user.uid);
          this.notify();
        } else {
          signInAnonymously(activeAuth).catch((err) => {
            console.warn('[AuthService] Anonymous sign-in error, using local identity:', err);
          });
        }
      });
    }
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
