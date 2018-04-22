
class NotFoundError extends Error {
  constructor(message?:string){
    super(message || 'NotFound');
    this.name = 'NotFoundError';
  }
}

