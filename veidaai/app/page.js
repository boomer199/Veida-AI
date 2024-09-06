"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import styles from './page.module.css';
import "./globals.css";
import { FaRegLightbulb, FaRegStickyNote, FaRegQuestionCircle, FaArrowLeft } from 'react-icons/fa';

export default function Home() {
  const router = useRouter();
  const [previewedFeatureId, setPreviewedFeatureId] = useState('flashcardPreview');
  
  const mobileBreakPoint = 781;
  const [isMobile, setIsMobile] = useState(false);
  const [slide, setSlide] = useState({num: null, ref: null});
  const mobileGalleryRef = useRef(null);
  const mobileFlashcardSlideRef = useRef(null);
  const mobileMcqSlideRef = useRef(null);
  const mobileNotesSlideRef = useRef(null);
  
  // call this fx() when window is resized to reevaluate isMobile against mobileBreakPoint
  function reportWindowSize() {
    setIsMobile( window.innerWidth <= mobileBreakPoint );
    console.log( window.innerWidth );
  }

  window.onresize = reportWindowSize;

  useEffect( () => {
    setSlide({ num: 1, ref: mobileFlashcardSlideRef });
    reportWindowSize();
  }, []);

  function galleryButtonOnClick(direction) {
    let newSlideNum;

    if (direction === 'left') {
      newSlideNum = slide.num === 1 ? 3 : slide.num -1;
    }

    else if (direction === 'right'){
      newSlideNum = (slide.num % 3) + 1;
    }

    else {
      console.error('error: mobile gallery buttons');
      return;
    }

    let newRef;
    switch(newSlideNum) {
      case 1:
        newRef = mobileFlashcardSlideRef;
        break;
      case 2: 
        newRef = mobileMcqSlideRef;
        break;
      case 3: 
        newRef = mobileNotesSlideRef;
        break;
    }

    setSlide({ num: newSlideNum, ref: newRef });
    newRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest'});
  }

  return (
    <>
      <Head>
        <title>Veida AI - Revolutionizing Learning</title>
        <meta name="description" content="We are your all-in-one secret academic weapon, designed and developed by students, for students." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id={styles.siteWrapper}> 
        <div className="container" id={styles.landingSection}>  
          <div className="double-column-container">
          <div className="feature-column-text">
            <h1>{`Professors Hate Us.\nSkip Classes.\nAce Finals.`}</h1>
            <p>
              {`We\'re your all-in-one academic weapon. Summarize your lectures, generate study plans, and track your progress. No more stress. No more confusion.`}
            </p>
            <button  
              className="primary"
              onClick={() => router.push('/client')}
            >
              Get Started for Free
            </button>
          </div>
          <div className="feature-column-media">
            <img
              id={styles.landingImg}
              className={styles.sectionImg}
              src="illustrations/student-studies-with-ai.svg"
              alt="student-studies-with-ai-illustration"
              width={630}
              height={340}
            />
          </div>
          </div>
        </div>

        {/*1st feature section*/}
        <div className="container" id={styles.uploadFeatureSection}>
          <div className="double-column-container">
            <div className="feature-column-text right-align">
              <h2>Upload Your Lecture Material</h2>
              <p>We accept files in:<br/>.txt, .pdf, .jpg, .png</p>
              <button 
                className="secondary" 
                onClick={() => router.push('/client')} 
              >
                Upload your file
              </button>
            </div>
            <div className="feature-column-media">
              <img 
                id={styles.uploadImg}
                className={styles.sectionImg}
                src="illustrations/data-or-cloud-migration.svg"
                alt="data-or-cloud-migration-illustration"
                width={630} 
                height={340}
              />
            </div>
          </div>
        </div>

        {/*2nd feature section*/}
        <div className="container" id={styles.featurePreviewSection}>
          <div className="double-column-container">
            <h2 className="center">AI Generates your study material</h2>
            <p className="subtitle center">Main ideas & key details are identified to create your interactive study methods</p>

            {isMobile ? 
              // return this jsx if screen-size is mobile
              <>
                <div className={styles.galleryNav}>
                  <p>{`${slide.num}/3`}</p>
                  <div>
                    <button onClick={()=>galleryButtonOnClick('left')}>
                      &#65308;
                    </button>
                    <button onClick={()=>galleryButtonOnClick('right')}>
                      &#65310;
                    </button>
                  </div>
                </div>

                <div id={styles.gallery} ref={mobileGalleryRef}>
                  <div className={styles.galleryFeature} ref={mobileFlashcardSlideRef}>
                    <img 
                        src="feature-flashcards.png" 
                        alt="preview of flashcards feature"
                        width={400}
                        height={400}
                    />
                    <h3 className={styles.galleryTitle}>Flashcards</h3>
                    <p className={styles.galleryDescr}>Test your memory on key ideas & important vocabulary</p>
                    <button className="secondary">Generate your own</button>
                  </div>

                  <div className={styles.galleryFeature} ref={mobileMcqSlideRef}>
                    <img 
                      src="feature-mcqs.png" 
                      alt="preview of quiz feature" 
                      width={400} 
                      height={400}
                    />
                    <h3 className={styles.galleryTitle}>Multiple Choice Questions</h3>
                    <p className={styles.galleryDescr}>MCQs test your retention with 5 strategies: synthesis, reorganization, comparison, application, and context.<br/><br/>In-depth explanations provided with each solution</p>
                    <button className="secondary">Generate your own</button>
                  </div>

                  
                  <div className={styles.galleryFeature} ref={mobileNotesSlideRef}>
                    <img
                      id={styles.mobileGalleryNotesImg}
                      src="feature-notes.png" 
                      alt="preview of notes feature" 
                      width={400} 
                      height={400}
                    />
                    <h3 className={styles.galleryTitle}>Outlined Notes</h3>
                    <p className={styles.galleryDescr}>Outlined summaries focus on main ideas, sub-concepts, key details, and definitions.</p>
                    <button className="secondary">Generate your own</button>
                  </div>
                </div>
              </> 
            :
              //return this jsx if screen-size is not mobile
              <>
                <div id={styles.featureMenuContainer} className="feature-column-text">
                  <ul id={styles.featureMenu}>

                    <span className={styles.liContainer}
                      // assign id only if this span is currently selected
                      id={'flashcardPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeaturePreview : null}
                      onClick={()=>setPreviewedFeatureId('flashcardPreview')}
                      >
                      <FaRegLightbulb className={styles.featurePreviewIcon} />
                      <li>flashcards</li>
                    </span>
                    
                    <span className={styles.liContainer}
                      // assign id only if this span is currently selected
                      id={'mcqPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeaturePreview : null}
                      onClick={()=>setPreviewedFeatureId('mcqPreview')}
                    >
                      <FaRegQuestionCircle className={styles.featurePreviewIcon} />
                      <li>multiple choice questions</li>
                    </span>
                    
                    <span
                      className={styles.liContainer} 
                      // assign id only if this span is currently selected
                      id={'notesPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeaturePreview : null} 
                      onClick={()=>setPreviewedFeatureId('notesPreview')}
                    >
                      <FaRegStickyNote className={styles.featurePreviewIcon} />
                      <li>outlined notes</li>
                    </span>

                  </ul>
                </div>
              
                <div className="feature-column-media">
                  <div id={styles.featureImgContainer}>
                    <img 
                      id={'flashcardPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeatureImg : null}
                      className={styles.featureImg} 
                      src="feature-flashcards.png" 
                      alt="preview of flashcards feature" 
                      width={500} 
                      height={400}
                    />
                    <img 
                      id={'mcqPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeatureImg : null}
                      className={styles.featureImg}
                      src="feature-mcqs.png" 
                      alt="preview of multiple choice questions feature" 
                      width={500} 
                      height={400}
                    />
                    <img 
                      id={'notesPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedFeatureImg : null}
                      className={styles.featureImg} 
                      src="feature-notes.png" 
                      alt="preview of summarized notes feature" 
                      width={500} 
                      height={400}
                    />
                  </div>

                  <div 
                    id={'flashcardPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedCaption : null}
                    className={styles.captionSection}
                  >
                    <p style={{padding: 0}}>Test your memory on key ideas & important vocabulary</p>
                    <button class="secondary" onClick={() => router.push('/client')}>
                      Generate your own
                    </button>
                  </div>

                  <div 
                    id={'mcqPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedCaption : null}
                    className={styles.captionSection}
                  >
                    <p>MCQs test your retention with 5 strategies: synthesis, reorganization, comparison, application, and context.<br/><br/>In-depth explanations provided with each solution</p>
                    <button class="secondary" onClick={() => router.push('/client')}>
                      Generate your own
                    </button>
                  </div>

                  <div 
                    id={'notesPreview'.localeCompare(previewedFeatureId) == 0 ? styles.selectedCaption : null}
                    className={styles.captionSection}
                  >
                    <p>Outlined summaries focus on main ideas, sub-concepts, key details, and definitions.</p>
                    <button class="secondary" onClick={() => router.push('/client')}>
                      Generate your own
                    </button>
                  </div>

                </div>
              </> //end of non-mobile jsx
            }
          </div>
        </div> {/* end of 2nd feature section */}

        {/*3rd feature section*/}
        <div className="container" id={styles.notiFeatureSection}>
          <div className="double-column-container">
            <div className="feature-column-media" >
              <img 
                id={styles.scheduleImg}
                className={styles.sectionImg} 
                src="illustrations/personal-workplace.svg" 
                alt="personal-workplace-illustration" 
                width={630} 
                height={340}
              />
            </div>

            <div className="feature-column-text right-align">
              <h2>Stay on schedule</h2>
              <p>We send study reminders so you can memorize the content in time for your exam</p>
              <button className="secondary" onClick={() => router.push('/client')}>
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/*plan comparison section*/}
        {/* <div>

        </div> 

        </div>*/}
      </div>
    </>
  );
}