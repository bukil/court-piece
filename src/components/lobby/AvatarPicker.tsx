import { useState } from 'react';
import { PHOTO_AVATARS } from '../../data/photoAvatars';
import { EMOJI_AVATARS } from '../../data/avatarCatalog';
import { Avatar } from '../common/Avatar';
interface AvatarPickerProps { selectedId: string; onSelect: (avatarId: string) => void; }
export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  const [category, setCategory] = useState<'photos' | 'emoji'>('photos');
  const choices = category === 'photos' ? PHOTO_AVATARS : EMOJI_AVATARS;
  return <fieldset className="avatar-picker">
    <legend>Choose your avatar</legend>
    <div className="avatar-picker-header"><Avatar seed="preview" avatarId={selectedId} size="md" /><div className="avatar-categories" aria-label="Avatar categories"><button type="button" aria-pressed={category === 'photos'} onClick={() => setCategory('photos')}>Photos</button><button type="button" aria-pressed={category === 'emoji'} onClick={() => setCategory('emoji')}>Emoji</button></div></div>
    <div key={category} className="avatar-choices" aria-label={category === 'photos' ? 'Photo avatars' : 'Emoji avatars'}>
      {choices.map((avatar,index) => <label className="avatar-choice" key={avatar.id} title={avatar.label}>
        <input type="radio" name="avatar" value={avatar.id} checked={selectedId === avatar.id} onChange={() => onSelect(avatar.id)} aria-label={avatar.label} />
        {'src' in avatar ? <img src={`${import.meta.env.BASE_URL}${avatar.src}`} alt="" width="48" height="48" loading={index < 18 ? 'eager' : 'lazy'} decoding="async" /> : <Avatar seed="choice" avatarId={avatar.id} size="md" animate={false} />}
        <span className="avatar-check" aria-hidden="true">✓</span>
      </label>)}
    </div>
  </fieldset>;
}
