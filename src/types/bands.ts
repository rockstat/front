

export interface MethodRegistrationOptions {
  service?: string;
}

export type MethodRegistration = {
  service: string;
  method: string;
  role: string;
  options: MethodRegistrationOptions;
}
