import { TilesRenderer, Tile } from '3d-tiles-renderer'
import * as THREE from 'three'

export const useTileShow = (tiles: TilesRenderer, callback: (scene: THREE.Object3D, tile: Tile) => Promise<void>) => {
    tiles.addEventListener('tile-visibility-change', ({ tile, visible }) => {
        const scene = (tile as any).cached.scene
        const group = tiles.group

        if (visible) {
            if (scene) {
                group.remove(scene)
            }

            callback(scene, tile).then(() => {
                if (scene) {
                    group.add(scene)
                    scene.updateMatrixWorld(true)
                }
            })
        }
    })
}

export const useTileShowAfter = (tiles: TilesRenderer, callback: (scene: THREE.Object3D, tile: Tile) => Promise<void>) => {
    tiles.addEventListener('tile-visibility-change', ({ tile, visible }) => {
        const scene = (tile as any).cached.scene

        if (visible) {
            callback(scene, tile)
        }
    })
}

export const useTileHide = (tiles: TilesRenderer, callback: (scene: THREE.Object3D, tile: Tile) => Promise<void>) => {
    tiles.addEventListener('tile-visibility-change', ({ tile, visible }) => {
        const scene = (tile as any).cached.scene
        const group = tiles.group

        if (!visible) {
            if (scene) {
                group.add(scene)
                scene.updateMatrixWorld(true)
            }

            callback(scene, tile).then(() => {
                if (scene) {
                    group.remove(scene)
                }
            })
        }
    })
}
