import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { ProfileCard } from '../components/profile/ProfileCard';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { Button } from '../components/ui/Button';

export function Profile() {
  const navigate = useNavigate();
  const { profile, profileLoading, updateProfile } = useProfile();
  const [editName, setEditName] = useState(profile.name);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync edit fields once profile loads from Supabase
  useEffect(() => {
    if (!profileLoading) {
      setEditName(profile.name);
      setEditAvatar(profile.avatar);
    }
  }, [profileLoading]);

  async function handleSave() {
    setSaveError('');
    const { error } = await updateProfile({ name: editName || 'Traveller', avatar: editAvatar });
    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-wood-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>
        <h1 className="font-cinzel font-bold text-gold text-xl">Profile</h1>
      </div>

      <div className="flex-1 p-4 space-y-5 max-w-md mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ProfileCard profile={{ ...profile, name: editName, avatar: editAvatar }} />
        </motion.div>

        {/* Edit section */}
        <motion.div
          className="bg-wood border border-wood-light rounded-xl p-5 space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="font-cinzel text-gold font-semibold">Edit Profile</p>

          <div>
            <label className="font-cinzel text-parchment-dim text-sm block mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={20}
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="font-cinzel text-parchment-dim text-sm block mb-2">Avatar</label>
            <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
          </div>

          {saveError && (
            <p className="font-cinzel text-danger-light text-xs text-center bg-danger-dark/30 border border-danger rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
