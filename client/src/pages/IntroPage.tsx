import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type QuizStep = "landing" | "q1" | "q2" | "q3" | "result";

export default function IntroPage() {
  const [currentStep, setCurrentStep] = useState<QuizStep>("landing");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Capture UTM parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const utmParams = {
      source: searchParams.get('utm_source'),
      adid: searchParams.get('utm_adid'),
      angle: searchParams.get('utm_angle'),
      funnel: searchParams.get('utm_funnel'),
      raw: Object.fromEntries(searchParams.entries()) // Store all parameters
    };

    // Enhanced UTM parameter logging
    console.log('[UTM Debug] Initial page load:', {
      currentUrl: window.location.href,
      rawSearchParams: window.location.search,
      parsedParams: Object.fromEntries(searchParams.entries()),
      extractedUtmParams: utmParams,
      timestamp: new Date().toISOString()
    });
    
    // Store UTM data in localStorage for registration
    if (Object.values(utmParams).some(v => v)) {
      localStorage.setItem('utm_data', JSON.stringify(utmParams));
      console.log('[UTM Debug] Parameters stored in localStorage:', {
        params: utmParams,
        storedValue: localStorage.getItem('utm_data'),
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('[UTM Debug] No UTM parameters to store:', {
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries()),
        localStorage: {
          hasExistingUtmData: !!localStorage.getItem('utm_data'),
          existingData: localStorage.getItem('utm_data')
        },
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const questions = {
    q1: {
      text: "When you see successful people, which pattern have you noticed most?",
      options: [
        "They seem to attract opportunities without trying",
        "They appear to make better decisions naturally",
        "They have an unexplainable \"lucky streak\"",
      ],
    },
    q2: {
      text: "What's your biggest frustration in building wealth?",
      options: [
        "Working hard but seeing others pass you by",
        "Making good choices but not seeing results",
        "Feeling like something invisible is holding you back",
      ],
    },
    q3: {
      text: "If science discovered a way to measure your natural 'wealth alignment' score in 30 seconds, what would you hope to learn?",
      options: [
        "Why some opportunities feel right while others don't",
        "How to tap into more \"lucky\" breaks",
        "What's really blocking my financial growth",
      ],
    },
  };

  // Track funnel events with enhanced error handling and debugging
    const trackFunnelEvent = async (eventType: string, eventData?: string) => {
    const eventId = Math.random().toString(36).substring(7);
    const eventStart = new Date();
    
    const sessionId = localStorage.getItem('sessionId') ||  Math.random().toString(36).substring(7);
    console.log(`sessionId is ${sessionId}`)
    localStorage.setItem('sessionId', sessionId);
    
    // Pre-request logging
    console.log('[Funnel Event Starting]', {
      eventId,
      eventType,
      eventData,
      timestamp: eventStart.toISOString(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionData: {
        hasCookie: document.cookie.includes('connect.sid'),
        hasLocalStorage: Boolean(localStorage.getItem('lastEventTimestamp')),
        lastEventTimestamp: localStorage.getItem('lastEventTimestamp')
      },
      performance: {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
      }
    });

    // Store last event timestamp for debugging
    localStorage.setItem('lastEventTimestamp', eventStart.toISOString());

    try {
      const startTime = performance.now();
      const response = await fetch("/api/admin/funnel/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-ID": eventId
        },
        body: JSON.stringify({
          eventType,
          eventData,
          sessionId,
          clientTimestamp: new Date().toISOString(),
          previousEvent: localStorage.getItem('lastEventTimestamp')
        }),
        credentials: "include"
      });
      
      const endTime = performance.now();
      console.log('[Funnel Event Response]', {
        eventId,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        performance: {
          durationMs: endTime - startTime,
          timestamp: new Date().toISOString()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to track funnel event: ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('[Funnel Event Success]', {
        eventId,
        eventType,
        eventData,
        result,
        performance: {
          durationMs: performance.now() - startTime
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Funnel Event Error]", {
        eventId,
        eventType,
        eventData,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        context: {
          url: window.location.pathname,
          hasSession: document.cookie.includes('connect.sid'),
          lastSuccess: localStorage.getItem('lastEventTimestamp')
        },
        timestamp: new Date().toISOString()
      });

      // Report error to user in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Funnel tracking failed - check console for details');
      }
    }
  };

  // Track page view on mount
  useEffect(() => {
    trackFunnelEvent("page_view", "/intro");
  }, []);

  const handleAnswer = async (question: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [question]: answer }));
    
    // Track quiz progression
    switch (question) {
      case "q1":
        await trackFunnelEvent("quiz_step", "1");
        setCurrentStep("q2");
        break;
      case "q2":
        await trackFunnelEvent("quiz_step", "2");
        setCurrentStep("q3");
        break;
      case "q3":
        await trackFunnelEvent("quiz_step", "3");
        setCurrentStep("result");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="absolute inset-0 bg-[url('/wealth-pattern.svg')] opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      <div className="relative container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentStep === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center space-y-8"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Have You Ever Wondered Why Some People 'Just Know' The Right Financial Moves To Make?
              </h1>
              <p className="text-xl md:text-2xl text-cyan-100/80 leading-relaxed">
                Answer 3 questions and do a free 30-second voice analysis to unlock your personal Wealth Alignment Score - the hidden factor that determines your financial future
              </p>
              <Button
                onClick={async () => {
                  await trackFunnelEvent("quiz_start");
                  setCurrentStep("q1");
                }}
                className="group mt-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                <span className="text-lg">Begin Your Wealth Analysis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </Button>
            </motion.div>
          )}

          {(currentStep === "q1" || currentStep === "q2" || currentStep === "q3") && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-2xl mx-auto text-center space-y-8"
            >
              <h2 className="text-3xl font-bold text-cyan-100">
                {questions[currentStep].text}
              </h2>
              <div className="space-y-4">
                {questions[currentStep].options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(currentStep, option)}
                    className="w-full bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 text-left p-6 rounded-xl transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-2xl mx-auto text-center space-y-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Your Answers Reveal Something Fascinating...
              </h2>
              <p className="text-xl text-cyan-100/80 leading-relaxed">
                Based on your responses, you're showing signs of having natural wealth-building potential - but your 'wealth frequency' may be misaligned, blocking your success.
                <br /><br />
                The good news? We can measure your exact Wealth Alignment Score in just 30 seconds using our AI voice analysis technology.
              </p>
              <Button
                onClick={async () => {
                  try {
                    // Track completion
                    await trackFunnelEvent("intro_complete");

                    // Generate free registration token with is_intro parameter
                    console.log('[Intro Flow Debug] Generating registration token with parameters:', {
                      is_intro: true,
                      source: 'intro_flow',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Get stored UTM data
                    const storedUtmData = localStorage.getItem('utm_data');
                    const utmParams = storedUtmData ? JSON.parse(storedUtmData) : {};
                    
                    console.log('[Intro Flow Debug] Generating registration token with parameters:', {
                      is_intro: true,
                      source: 'intro_flow',
                      utm_data: utmParams,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Enhanced logging for request body
                    const requestBody = {
                      parameters: {
                        is_intro: true,
                        source: 'intro_flow',
                        utm_data: utmParams // Include UTM data in token parameters
                      }
                    };
                    
                    console.log('[Intro Flow Debug] Generating registration token with parameters:', {
                      is_intro: true,
                      source: 'intro_flow',
                      timestamp: new Date().toISOString(),
                      requestBody,
                      storedUtmData: utmParams,
                      currentUrl: window.location.href
                    });

                    const response = await fetch("/api/admin/free-registration-token", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(requestBody),
                      credentials: "include",
                    });
                    
                    const responseData = await response.json();
                    console.log('[Intro Flow Debug] Registration token response:', {
                      status: response.status,
                      statusText: response.statusText,
                      token: responseData.token,
                      headers: Object.fromEntries(response.headers.entries()),
                      storedUtmData: utmParams,
                      requestBody: {
                        parameters: {
                          is_intro: true,
                          source: 'intro_flow',
                          utm_data: utmParams
                        }
                      },
                      timestamp: new Date().toISOString()
                    });
                    
                    if (!response.ok || !responseData.token) {
                      console.error('[Intro Flow Error]', {
                        status: response.status,
                        responseData,
                        timestamp: new Date().toISOString()
                      });
                      throw new Error("Failed to generate registration token");
                    }

                    // Track successful token generation
                    await trackFunnelEvent("registration_token_generated", responseData.token);
                    
                    // Construct registration URL with token and UTM parameters
                    const registrationUrl = new URL('/register', window.location.href);
                    registrationUrl.searchParams.set('token', responseData.token);
                    registrationUrl.searchParams.set('is_intro', 'true');  // Add is_intro parameter

                    
                    // Add UTM parameters from stored data
                    if (utmParams) {
                      Object.entries(utmParams).forEach(([key, value]) => {
                        if (value) {
                          registrationUrl.searchParams.set(`utm_${key}`, value as string);
                        }
                      });
                    }
                    
                    console.log('[Intro Flow Debug] Redirecting to registration:', {
                      originalUrl: window.location.href,
                      registrationUrl: registrationUrl.toString(),
                      token: responseData.token,
                      utmParams,
                      timestamp: new Date().toISOString()
                    });

                    // Redirect to registration page
                    window.location.href = registrationUrl.toString();
                  } catch (error) {
                    console.error("Error in intro completion:", error);
                    // Show error to user instead of silent fallback
                    alert("Sorry, there was an error. Please try again or contact support.");
                  }
                }}
                className="group w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                <span className="text-lg">Get my free wealth alignment voice analysis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </Button>
              <p className="text-sm text-cyan-400/60">
                Takes 30 seconds • 100% private • 2,547 people analyzed today
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}