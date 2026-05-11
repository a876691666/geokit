import { type TresLoader, type TresObject3D } from '@tresjs/core'
import { DRACOLoader, GLTFLoader } from 'three-stdlib'
import { Loader } from 'three'
import type { AnimationClip, LoadingManager, Material, Scene } from 'three'
import type { GLTF } from 'three-stdlib'

/**
 * A wrapper class that implements TresLoader<GLTF> interface
 * to make GLTFLoader compatible with TresJS loader system.
 */
class TresGLTFLoaderClass extends Loader implements TresLoader<GLTF> {
	private gltfLoader: GLTFLoader

	constructor(manager?: LoadingManager) {
		super(manager)
		this.gltfLoader = new GLTFLoader(manager)
	}

	/**
	 * Load a GLTF model from a URL or array of URLs.
	 * If an array is provided, only the first URL will be used.
	 */
	load(
		url: string | string[],
		onLoad: (result: GLTF) => void,
		onProgress?: (event: ProgressEvent<EventTarget>) => void,
		onError?: (event: ErrorEvent) => void,
	): void {
		const singleUrl = Array.isArray(url) ? url[0] : url
		this.gltfLoader.load(singleUrl, onLoad, onProgress, onError)
	}

	/**
	 * Asynchronously load a single GLTF model.
	 */
	async loadAsync(url: string | string[]): Promise<GLTF> {
		const singleUrl = Array.isArray(url) ? url[0] : url
		return this.gltfLoader.loadAsync(singleUrl)
	}

	/**
	 * Set the DRACO loader for compressed models.
	 */
	setDRACOLoader(dracoLoader: DRACOLoader): GLTFLoader {
		return this.gltfLoader.setDRACOLoader(dracoLoader)
	}
}

export interface GLTFLoaderOptions {
	/**
	 * Whether to use Draco compression.
	 */
	draco?: boolean
	/**
	 * The path to the Draco decoder.
	 */
	decoderPath?: string
}

export interface GLTFResult {
	animations: Array<AnimationClip>
	nodes: Record<string, TresObject3D>
	materials: Record<string, Material>
	scene: Scene
}

export interface TresGLTFLoaderType extends TresLoader<GLTF> {
	setDRACOLoader?: (dracoLoader: DRACOLoader) => void
}

/**
 * Sets the extensions for the GLTFLoader.
 *
 * @param {GLTFLoaderOptions} options - Options for the loader
 * @param {(loader: TresGLTFLoaderType) => void} [extendLoader] - Function to extend the loader
 * @returns {Object} - Returns loader extension function and dracoLoader instance
 */
function setExtensions(options: GLTFLoaderOptions, extendLoader?: (loader: TresGLTFLoaderType) => void) {
	let dracoLoader: DRACOLoader | null = null

	const loaderExtension = (loader: TresGLTFLoaderType) => {
		if (extendLoader) {
			extendLoader(loader)
		}
		if (options.draco) {
			if (!dracoLoader) {
				dracoLoader = new DRACOLoader()
			}
			dracoLoader.setDecoderPath(options.decoderPath || 'https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
			if (loader.setDRACOLoader) {
				loader.setDRACOLoader(dracoLoader)
			}
		}
	}

	return {
		loaderExtension,
		dracoLoader: () => dracoLoader,
	}
}

/**
 * Loads a GLTF file (or files) and returns the GLTF result(s).
 *
 * Note: `useLoader` in `@tresjs/core` v5+ returns a reactive state wrapper
 * (`{ state, isLoading, error, load, progress }`) instead of a Promise
 * resolving to the asset. Awaiting it yields that wrapper, not the GLTF,
 * which breaks downstream consumers that destructure `scene`. We therefore
 * instantiate the loader directly and call `loadAsync` ourselves.
 *
 * @export
 * @template T
 * @param {T} path - Path or array of paths to the GLTF file(s)
 * @param {GLTFLoaderOptions} [options] - Options for the loader
 * @param {(loader: TresGLTFLoaderType) => void} [extendLoader] - Function to extend the loader
 * @returns {Promise<T extends string[] ? GLTFResult[] : GLTFResult>} Promise that resolves with the loaded model(s)
 */
export async function useGLTF<T extends string | string[]>(
	path: T,
	options: GLTFLoaderOptions = {
		draco: false,
	},
	extendLoader?: (loader: TresGLTFLoaderType) => void,
): Promise<T extends string[] ? GLTFResult[] : GLTFResult> {
	const loader = new TresGLTFLoaderClass()
	const { loaderExtension, dracoLoader } = setExtensions(options, extendLoader)
	loaderExtension(loader)

	try {
		if (Array.isArray(path)) {
			const results = await Promise.all(path.map((p) => loader.loadAsync(p)))
			return results as unknown as T extends string[] ? GLTFResult[] : GLTFResult
		}

		const gltfModel = await loader.loadAsync(path)
		return gltfModel as unknown as T extends string[] ? GLTFResult[] : GLTFResult
	} finally {
		// 清理当前实例的 dracoLoader（加载失败也能释放）
		const currentDracoLoader = dracoLoader()
		if (currentDracoLoader) {
			currentDracoLoader.dispose()
		}
	}
}
