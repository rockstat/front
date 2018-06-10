

export interface MethodRegistrationOptions {
  service?: string;
  key?: Array<string>
}

export interface MethodRegRequest {
  register?: Array<MethodRegistration>
}

export interface MethodRegistration {
  service: string;
  method: string;
  role: string;
  options: MethodRegistrationOptions;
}
