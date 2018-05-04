export function handleStart(cls: { started?: boolean }) {
  if (cls.started === true) {
    throw new Error('Already started');
  } else {
    cls.started = true;
  }
}


export function handleSetup(cls: { started?: boolean }) {
  if (cls.started === true) {
    throw new Error('Already setup');
  } else {
    cls.started = true;
  }
}
