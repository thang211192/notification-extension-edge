import {copyFile,cp,mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=join(root,'release','mam-edge');
const files=['manifest.json','background.js','state.js','popup.html','popup.css','popup.js','reminder.js','README.md'];
await mkdir(destination,{recursive:true});
for(const file of files) {
  await copyFile(join(root,file),join(destination,file));
  const [source,copied]=await Promise.all([readFile(join(root,file)),readFile(join(destination,file))]);
  if(!source.equals(copied))throw new Error(`Release mismatch: ${file}`);
}
await cp(join(root,'icons'),join(destination,'icons'),{recursive:true});
console.log(`Unpacked extension updated: ${destination}`);
