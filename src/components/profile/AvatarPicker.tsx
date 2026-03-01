import { AVATARS } from '../../types/player';
import { cn } from '../../utils/cn';

interface AvatarPickerProps {
  value: string;
  onChange: (avatar: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            'w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all border-2',
            value === emoji
              ? 'border-gold bg-wood-light scale-110 shadow-gold/30 shadow-lg'
              : 'border-transparent bg-wood hover:border-gold/40 hover:bg-wood-light'
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
