import glob,sys,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
files=sorted(glob.glob('src/*.js'))
test='--test' in sys.argv
out=[f for f in files if not os.path.basename(f).startswith('99_')]
if test: out=out+[f for f in files if os.path.basename(f).startswith('99_')]
code='\n'.join(open(f).read() for f in out)
open('game_test.js' if test else 'game.js','w').write(code)
print(('game_test.js' if test else 'game.js'),len(code))
