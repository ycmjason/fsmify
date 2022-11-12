export type NoInfer<X extends string> = X extends infer Y ? (Y extends X ? Y : never) : never;
