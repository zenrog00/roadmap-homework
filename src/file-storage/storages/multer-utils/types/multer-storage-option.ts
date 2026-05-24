import type { Request } from 'express';

export type OptionCallback<T> = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, value: T) => void,
) => void;

// shows if storage option key type satisfies OptionCallback type
type HasOptionCallback<T> =
  Extract<Exclude<T, undefined>, OptionCallback<any>> extends never
    ? false
    : true;

// getting only keys of type T that satisfy OptionCallback type
export type KeysWithOptionCallback<T> = {
  [K in keyof T]: HasOptionCallback<T[K]> extends true ? K : never;
}[keyof T] &
  // this allows Typescript to use T type keys to index-access T type
  // otherwise Typescript can't use potential union
  // of partial keys of type T to index it
  keyof T;

// resolves a storage option type to its underlying value type
// if it is OptionCallback, uses that callback's value type parameter
// otherwise leaves the type unchanged
export type ResolvedOption<T> = T extends OptionCallback<infer U> ? U : T;

// needed so optional options don't widen callback unions and break inference
export type DefinedResolvedOption<T> = ResolvedOption<Exclude<T, undefined>>;
