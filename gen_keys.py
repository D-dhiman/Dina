from py_vapid import Vapid02
import base64

v = Vapid02()
v.generate_keys()
v.save_key('private_key.pem')
v.save_public_key('public_key.pem')

# Properly extract the raw uncompressed public key point and base64url-encode it
raw_public = v.public_key.public_bytes(
    encoding=__import__('cryptography.hazmat.primitives.serialization', fromlist=['Encoding']).Encoding.X962,
    format=__import__('cryptography.hazmat.primitives.serialization', fromlist=['PublicFormat']).PublicFormat.UncompressedPoint,
)

encoded = base64.urlsafe_b64encode(raw_public).decode('utf-8').rstrip('=')
print("VAPID_PUBLIC_KEY=" + encoded)