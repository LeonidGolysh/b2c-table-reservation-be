// Which table the authenticated account lives in. Ids are only unique within
// a table, so every access check must look at the kind as well as the id.
export enum AccountKind {
  USER = 'user',
  WORKER = 'worker',
}
