export let dev: boolean;
export let src: string;
export let dest: string;

export const set_dev = (_: boolean) => dev = _;
export const set_src = (_: string) => src = _;
export const set_dest = (_: string) => dest = _;
