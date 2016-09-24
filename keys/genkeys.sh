if [ -f privkey.pem ]; then
  echo "Keys exists. Delete them first if you want to generate a new pair of keys.";
else
  openssl genrsa -out ./privkey.pem 2048;
  openssl rsa -in ./privkey.pem -pubout -out ./pubkey.pem;
fi
