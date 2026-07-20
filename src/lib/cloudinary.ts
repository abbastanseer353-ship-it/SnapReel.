const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset)

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  thumbnailUrl: string
  duration?: number
}

/**
 * Uploads a video file to Cloudinary using an unsigned upload preset.
 * The preset must be created in the Cloudinary dashboard (Settings -> Upload)
 * with "Unsigned" mode enabled.
 */
export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    )
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText)
        const secureUrl: string = res.secure_url
        const publicId: string = res.public_id
        // Cloudinary can generate a poster frame by swapping the extension to .jpg
        const thumbnailUrl = secureUrl.replace(/\.[^/.]+$/, '.jpg')
        resolve({
          url: secureUrl,
          publicId,
          thumbnailUrl,
          duration: res.duration,
        })
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'))
    xhr.send(formData)
  })
}

/**
 * Uploads an image (payment screenshot, portfolio image, avatar) to Cloudinary
 * using the same unsigned preset via the image endpoint.
 */
export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary not configured.')
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText).secure_url as string)
      } else {
        reject(new Error(`Cloudinary image upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'))
    xhr.send(formData)
  })
}
