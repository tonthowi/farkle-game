import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QuitConfirmModalProps {
  open: boolean;
  onStay: () => void;
  onQuit: () => void;
}

export function QuitConfirmModal({ open, onStay, onQuit }: QuitConfirmModalProps) {
  return (
    <Modal open={open} title="Quit Match?">
      <p className="font-cinzel text-parchment text-center mb-6">
        Leaving an online match in progress will count as a loss.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onStay}>
          Stay
        </Button>
        <Button variant="primary" className="flex-1" onClick={onQuit}>
          Quit
        </Button>
      </div>
    </Modal>
  );
}
