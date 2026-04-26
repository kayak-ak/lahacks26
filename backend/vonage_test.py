from vonage import Auth, Vonage
from vonage_sms import SmsMessage

# 1. Initialize with the new Vonage class
client = Vonage(
    Auth(
        api_key="[API_KEY]",
        api_secret="API_SECRET",
    )
)

# 2. Create the message object
# Replace 'YOUR_VONAGE_NUMBER' with the number in your dashboard
message = SmsMessage(
    to="14158452653",
    from_="15809825321", 
    text="Hello from LA Hacks! v4 SDK is working."
)

# 3. Send using the sms property
response = client.sms.send(message)

if response.messages[0].status == '0':
    print("Message sent successfully.")
else:
    print(f"Error: {response.messages[0].error_text}")
