function find<T>(ts: Iterable<T>, fn: (t: T) => boolean): T | undefined {
	for (const t of ts) {
		if (fn(t)) {
			return t;
		}
	}
	return undefined;
}

export interface ChunkMeta {
	readonly id: string;
	readonly facadeId: string
	readonly name: string;
	readonly file_name: string;
}

export interface Chunk extends ChunkMeta {
	readonly deps: Iterable<this>;
	readonly transitive_deps: Iterable<this>;
	readonly manifest: ReadonlySet<string>;
}

export interface Internals extends ChunkMeta {
	readonly dep_names: Iterable<string>
	readonly manifest: Iterable<string>;
}

export class ChunkResolver<S> {
	private readonly resolve_id: ((chunk_file: string) => S | undefined);
	private readonly id: (s: S) => string;
	private readonly internals: (s: S) => Internals;

	private readonly module_imports: (importer_module_id: string) => Iterable<string>;
	private readonly chunks_from_modules: (s: S, module_ids: Iterable<string>) => Iterable<Internals>;
	private readonly chunk_cache: Map<string, Chunk>;

	constructor(opt: {
		resolve_id: ((chunk_file: string) => S | undefined),
		id: (s: S) => string,
		internals: (s: S) => Internals,
		module_imports: (importer_module_id: string) => Iterable<string>,		
		chunks_from_modules: (s: S, module_ids: Iterable<string>) => Iterable<Internals>,
	}) {
		this.resolve_id = opt.resolve_id;
		this.id = opt.id;
		this.internals = opt.internals;
		this.module_imports = opt.module_imports;
		this.chunks_from_modules = opt.chunks_from_modules;
		this.chunk_cache = new Map<string, Chunk>();
	}

	async resolve_chunk_by_id(id: string): Promise<Chunk | undefined> {
		return await this.resolve_chunk(this.resolve_id(id));
	}

	resolve_chunk(s: S): Promise<Chunk>;
	resolve_chunk(s: undefined): Promise<undefined>;
	resolve_chunk(s: S | undefined): Promise<Chunk | undefined>;
	async resolve_chunk(s: S | undefined): Promise<Chunk | undefined> {
		if (!s) {
			return undefined;
		}

		const id = this.id(s);
		let chunk = this.chunk_cache.get(id);
		if (!chunk) {
			const internals = this.internals(s);

			// Behavior for circular dependencies is undefined... (but will not result in an infinite loop)
			const deps: Chunk[] = [];
			const transitive_deps = new Set<Chunk>();

			const orphaned_module_ids = new Set<string>();
			const manifest = new Set(internals.manifest);

			chunk = {
				id,
				facadeId: internals.facadeId,
				name: internals.name,
				file_name: internals.file_name,
				manifest,
				deps,
				transitive_deps
			};
			this.chunk_cache.set(id, chunk);

			for (const dep_name of internals.dep_names) {
				const dep_chunk = await this.resolve_chunk_by_id(dep_name);
				if (dep_chunk) {
					deps.push(dep_chunk);
					transitive_deps.add(dep_chunk);
					for (const td of dep_chunk.transitive_deps) {
						transitive_deps.add(td);
					}
				}
			}

			// accumulate a set of orphaned_module_ids imported by this s but not any of imports.
			for (const module of manifest) {
				for (const addl_module of this.module_imports(module)) {
					const importer = find(transitive_deps, c => c.manifest.has(addl_module));
					if (!importer) {
						orphaned_module_ids.add(addl_module);
					}
				}
			}

			// if we have anything orphaned, then promote them to be a chunk of their own.
			if (orphaned_module_ids.size) {
				for (const proto_chunk of this.chunks_from_modules(s, orphaned_module_ids)) {
					const new_chunk: Chunk = {
						id: proto_chunk.id,
						facadeId: proto_chunk.facadeId,
						file_name: proto_chunk.file_name,
						name: proto_chunk.name,
						manifest: new Set(proto_chunk.manifest),
						deps: [],
						transitive_deps: []
					};

					this.chunk_cache.set(proto_chunk.id, new_chunk);

					deps.push(new_chunk);
					transitive_deps.add(new_chunk);
					for (const d of new_chunk.transitive_deps) {
						transitive_deps.add(d);
					}
				}
			}
		}

		return chunk;
	}

	chunks() {
		return this.chunk_cache.values();
	}
}