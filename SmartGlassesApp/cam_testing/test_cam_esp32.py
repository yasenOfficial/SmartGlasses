import asyncio
from bleak import BleakClient, BleakScanner
from PIL import Image
import io
import matplotlib.pyplot as plt

SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
COMMAND_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"
IMAGE_CHAR_UUID = "5a87b4ef-3bfa-4eb2-9be0-219c844ea3c0"

class ImageReceiver:
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.chunks = bytearray()
        self.expected_size = 0
        self.received_size = 0
        self.is_complete = False

    def process_data(self, data):
        if self.is_complete:
            return
        if not self.expected_size:
            if len(data) < 4:
                return
                
            self.expected_size = int.from_bytes(data[:4], 'little')
            print(f"Expecting {self.expected_size} byte image")
            
            self.chunks = bytearray(data[4:])
            self.received_size = len(data) - 4
        else:
            self.chunks.extend(data)
            self.received_size += len(data)
        
        print(f"Received {self.received_size}/{self.expected_size} bytes")
        
        if self.received_size >= self.expected_size:
            self.save_image()
            self.is_complete = True

    def save_image(self):
        try:
            if len(self.chunks) < 2 or self.chunks[0] != 0xFF or self.chunks[1] != 0xD8:
                print("Invalid JPEG header!")
                return
                
            with open("received.jpg", "wb") as f:
                f.write(self.chunks[:self.expected_size])
            print("Image saved successfully")
            
            img = Image.open(io.BytesIO(self.chunks[:self.expected_size]))
            plt.imshow(img)
            plt.axis('off')
            plt.show()
            
        except Exception as e:
            print(f"Error: {str(e)}")
        finally:
            self.reset()

async def main():
    receiver = ImageReceiver()
    
    print("Scanning for ESP32-CAM...")
    devices = await BleakScanner.discover()
    
    for d in devices:
        if d.name and "SmartGlasses" in d.name:
            print(f"Found {d.name} at {d.address}")
            
            async with BleakClient(d.address) as client:
                print("Sending capture command...")
                await client.write_gatt_char(COMMAND_CHAR_UUID, b'C')
                
                print("Waiting for image...")
                await client.start_notify(IMAGE_CHAR_UUID, 
                    lambda s, d: receiver.process_data(d))
                
                while not receiver.is_complete:
                    await asyncio.sleep(0.1)
                
                await client.stop_notify(IMAGE_CHAR_UUID)
                print("Done!")
            break

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Stopped by user")