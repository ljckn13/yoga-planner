import type { TLAssetStore, TLAsset } from 'tldraw'

// Asset store for handling file uploads to Cloudflare R2 via our sync server
export const assetStore: TLAssetStore = {
  async upload(asset: TLAsset, file: File, abortSignal?: AbortSignal) {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('asset', JSON.stringify(asset))

      // Upload to our Cloudflare worker
      const response = await fetch(
        `${import.meta.env.VITE_TLDRAW_WORKER_URL || 'https://tldraw-worker.le-jckn.workers.dev'}/upload`,
        {
          method: 'POST',
          body: formData,
          signal: abortSignal,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return { src: result.url }
    } catch (error) {
      console.error('Asset upload failed:', error)
      throw error
    }
  },

  resolve(asset: TLAsset) {
    // Return the asset URL for display
    return asset.props.src
  },
} 