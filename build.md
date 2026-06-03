npm run build
rm -rf /tmp/ghtest
mkdir -p /tmp/ghtest/vantagelabs
cp -r out/* /tmp/ghtest/vantagelabs/
npx serve /tmp/ghtest -l 3000