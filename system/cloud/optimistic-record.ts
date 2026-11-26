// Replay pending edits over the last acknowledged record. Failed edits roll back
// independently, so a late response cannot overwrite newer local changes.
export function createOptimisticRecord<T>(initial: T | null, publish: (value: T | null, pending: number) => void) {
 let confirmed = initial;
 const pending: Array<{ change: (value: T | null) => T | null; save: (next: T | null, previous: T | null) => Promise<T | null>; resolve: (value: T | null) => void; reject: (error: unknown) => void }> = [];
 let running = false;
 const emit = () => publish(pending.reduce((value, edit) => edit.change(value), confirmed), pending.length);
 const run = async () => {
   if (running) return;
   running = true;
   while (pending.length) {
     const edit = pending[0];
     try {
       const saved = await edit.save(edit.change(confirmed), confirmed);
       confirmed = saved;
       pending.shift(); emit(); edit.resolve(saved);
     } catch (error) { pending.shift(); emit(); edit.reject(error); }
   }
   running = false;
 };
 return {
   enqueue(change: (value: T | null) => T | null, save: (next: T | null, previous: T | null) => Promise<T | null>) {
     const task = new Promise<T | null>((resolve, reject) => pending.push({ change, save, resolve, reject }));
     emit();
     void Promise.resolve().then(run);
     return task;
   },
 };
}
