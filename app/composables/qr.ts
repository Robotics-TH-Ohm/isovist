import QRCode from 'qrcode'

export function useQrCode(text: string) {
  const url = shallowRef<string>('')

  const cm = useColorMode()
  const color = computed(() => {
    const dark = cm.preference === 'light' ? '#fff' : '#000'
    const light = cm.preference === 'light' ? '#000' : '#fff'
    return { dark, light }
  })

  watchEffect(() => {
    QRCode.toDataURL(text, {
      type: 'image/png',
      margin: 1,
      color: color.value,
    })
      .then(_url => url.value = _url)
  })

  return url
}
