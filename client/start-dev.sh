#!/bin/bash
export PATH="/Users/ayushupadhyay/.nvm/versions/node/v20.20.2/bin:$PATH"
cd "/Users/ayushupadhyay/Micro Apps/blog-generator/client"
exec /Users/ayushupadhyay/.nvm/versions/node/v20.20.2/bin/node \
  "/Users/ayushupadhyay/Micro Apps/blog-generator/client/node_modules/.bin/vite" \
  --port 5173
