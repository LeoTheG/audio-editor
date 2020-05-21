cd server
npm run build
cd ../client
npm run build
cd ..

rm -rf tmp-dir
mkdir tmp-dir
mv server/server-build tmp-dir
mv client/build tmp-dir

cp server/package.json tmp-dir/server-build

cd tmp-dir

zip ../prod.zip -r ./

cd ..
rm -rf tmp-dir