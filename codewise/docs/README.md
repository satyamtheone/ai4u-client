nvm install --lts
nvm use --lts
node -v
npm init -y
npm init -y
npm install -D @types/vscode @types/node typescript
npm install axios dotenv
npm install sqlite3
npm install -g vsce
npx tsc --init

<!-- Package & Test
Build & Package Commands -->
npm run compile
vsce package
# Install locally
code --install-extension codewise-chat-0.0.1.vsix
