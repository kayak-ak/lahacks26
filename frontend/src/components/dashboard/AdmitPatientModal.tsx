import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Room, RoomStatus } from './data';

type AdmitPatientModalProps = {
  room: Room;
  onClose: () => void;
  onAdmit: (roomId: string, data: { patient: string; age: number; reason: string; status: RoomStatus }) => void;
};

export function AdmitPatientModal({ room, onClose, onAdmit }: AdmitPatientModalProps) {
  const [patient, setPatient] = useState('');
  const [age, setAge] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<RoomStatus>('observation');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.trim()) return;
    
    onAdmit(room.id, {
      patient,
      age: parseInt(age, 10) || 0,
      reason,
      status,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-border shadow-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border bg-gradient-to-b from-blue-50/50 to-transparent">
          <DialogTitle className="text-2xl text-slate-900">Admit Patient</DialogTitle>
          <DialogDescription className="mt-1.5 text-[1.08rem] text-slate-500">
            Assign a new patient to {room.id}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 bg-white">
          <div className="grid gap-2">
            <label htmlFor="patient" className="text-sm font-semibold text-slate-700">Patient Name</label>
            <Input id="patient" value={patient} onChange={(e) => setPatient(e.target.value)} required placeholder="e.g. John Doe" className="h-11" />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="age" className="text-sm font-semibold text-slate-700">Age</label>
            <Input id="age" type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} required placeholder="e.g. 45" className="h-11" />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-semibold text-slate-700">Reason for Admission</label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. Post-op recovery" className="h-11" />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-semibold text-slate-700">Initial Status</label>
            <select
              id="status"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
            >
              <option value="stable">Stable</option>
              <option value="observation">Observation</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <DialogFooter className="mt-2 grid grid-cols-2 gap-3 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px] rounded-full font-medium">Cancel</Button>
            <Button type="submit" className="min-h-[44px] rounded-full font-medium bg-blue-600 hover:bg-blue-700">Admit Patient</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
