export type Chunk = {
	file: string;
	imports: string[];
	modules: string[];
}

export type CssFile = {
	id: string;
	code: string;
};

export class CompileError {
	file: string;
	message: string;
}

export class CompileResult {
	duration: number;
	errors: CompileError[];
	warnings: CompileError[];
	chunks: Chunk[];
	assets: Record<string, string>;
	css_files: CssFile[];
}