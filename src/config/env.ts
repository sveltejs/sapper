export let dev: boolean;
export let src: string;
export let dest: string;
export let module: boolean;

export const set_dev = (_: boolean) => dev = _;
export const set_src = (_: string) => src = _;
export const set_dest = (_: string) => dest = _;
export const set_module = (_: boolean) => module = _;
