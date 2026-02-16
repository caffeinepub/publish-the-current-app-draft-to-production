import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BuyerDetailsFieldsProps {
  name: string;
  phoneNumber: string;
  notes: string;
  onNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  errors?: {
    name?: string;
    phoneNumber?: string;
  };
}

export default function BuyerDetailsFields({
  name,
  phoneNumber,
  notes,
  onNameChange,
  onPhoneNumberChange,
  onNotesChange,
  errors,
}: BuyerDetailsFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="buyer-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="buyer-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your name"
          required
        />
        {errors?.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyer-phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="buyer-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="Enter your phone number"
          required
        />
        {errors?.phoneNumber && (
          <p className="text-sm text-destructive">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyer-notes">Notes (Optional)</Label>
        <Textarea
          id="buyer-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special instructions or notes"
          rows={3}
        />
      </div>
    </div>
  );
}
