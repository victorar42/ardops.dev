import qrcode

url = "https://ardops.dev/"

img = qrcode.make(url)
img.save("qr.png")

print("QR generado correctamente")