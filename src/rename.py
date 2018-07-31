'''
Created on Apr 5, 2013

@author: roderickmeaney
'''
import unittest
import glob, os, re


class Test(unittest.TestCase):


    def testName(self):
        #rename(r'/work/tmp/Season5', r'*.avi')
        #rename(r'C:/temp/Lego', r'*.avi')
        #C:\Users\Cathy M\Documents\Vuze Downloads\Lego Ninjago Masters of Spinjitzu - Complete {C_P}
        delete_except ('C:/temp/Calibre Library')
        #remove_empty_dirs ('C:/temp/t/Calibre Library')
        pass


def delete_except(dir):
    #removes non mobi files and deletes empty directories
    #run it a couple of times of there are several layers of empty directories
    for subdir, dirs, files in os.walk(dir):
        if not os.listdir(subdir):
            print "removing " + subdir
            os.rmdir(subdir)
        
        for file in files:
            print os.path.join(subdir, file)
            if '.mobi' not in file:
                print "deleting " + file
                os.remove(os.path.join(subdir, file))
        
def remove_empty_dirs(dir):
    if not os.listdir(dir):
        os.rmdir(dir)
        
def rename(dir, pattern):
    for pathAndFilename in glob.iglob(os.path.join(dir, pattern)):
        title, ext = os.path.splitext(os.path.basename(pathAndFilename))
        #new_title = re.sub(r'.*(S01.+)WEB.*', r'\1', title)
        #new_title = re.sub(r'.*\s-\s(\d\d\d.+).*', r'\1', title)
        new_title = title.replace(r'Minuscule.', '')
        new_title = new_title.replace(r'{C_P}', '')
        
        #Avengers.Assemble.S01E01.The.Avengers.Protocol.Pt.1.WEB-DL.x264.AAC
        #Spider-Man TAS - S1E04 - Doctor Octopus Armed and Dangerous [Austin316gb]
        #Spiderman - 201 - Neogenic Nightmare, Chapter I - The Insidisious Six
        #Minuscule.S01E01.DVDRip.x264-mOt.The.Ladybug.mp4
        #Minuscule.S02E33.2012.DVDRIP.XVID.At.Full.Speed
        
        print "%s to %s" % (pathAndFilename, new_title + ext) 
        
        
        os.rename(pathAndFilename, 
                  os.path.join(dir, new_title + ext))
        
if __name__ == "__main__":
    #import sys;sys.argv = ['', 'Test.testName']
    unittest.main()