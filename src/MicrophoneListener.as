/**
 * Flash-based microphone listener component
 * 
 * Copyright (c) Konstantin Tretyakov.
 * 
 * Released under MIT Licence.
 * 
 * The code is largely a refactoring of the work "A real-time spectrum analyzer" by G. T. Bearegard,
 * the latter also released via MIT license with the following note:
 * ==================
 * A real-time spectrum analyzer.
 *
 * Released under the MIT License
 *
 * Copyright (c) 2010 Gerald T. Beauregard
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * ==================
 */

package
{
    import __AS3__.vec.Vector;
    import flash.events.*;
	import flash.utils.Timer;
    import flash.media.Microphone;
    import flash.system.Security;
    import flash.system.SecurityPanel;

    public class MicrophoneListener {
		// Configuration
        public const SAMPLE_RATE:Number = 5000;   // Actual microphone sample rate (Hz) (only 5k, 8k, 11k, 22k and 44k are supported)
        public const LOGN:uint = 11;               // Log2 FFT length
        public const N:uint = 1 << LOGN;           // FFT Length
        public const BUF_LEN:uint = N;             // Length of buffer for mic audio

        private var m_fft:FFT2;                     // FFT object 
        private var m_tempRe:Vector.<Number>;     	// Temporary buffer - real part
        private var m_tempIm:Vector.<Number>;     	// Temporary buffer - imaginary part
        private var m_mag:Vector.<Number>;          // Magnitudes (at each of the frequencies below)
		private var m_freqs:Vector.<Number>;        // Frequencies (for each of the magnitudes above)
        private var m_win:Vector.<Number>;          // Analysis window (Hanning)
 
		private var m_mic:Microphone;               // Microphone object
        private var m_writePos:uint = 0;            // Position to write new audio from mic
        private var m_buf:Vector.<Number> = null;   // Buffer for mic audio

		private var m_microphoneEnabledCallback: Function;
		private var m_settingsScreenVisibilityCheck: Function;
		private var m_microphoneEnabledTimer: Timer;
		
        public function MicrophoneListener()
        {
            var i:uint;
 
            // Set up the FFT
            m_fft = new FFT2();
            m_fft.init(LOGN);
            m_tempRe = new Vector.<Number>(N);
            m_tempIm = new Vector.<Number>(N);
            m_mag = new Vector.<Number>(N/2);

            // Vector with frequencies for each bin number. Used
            // in the graphing code (not in the analysis itself).
			m_freqs = new Vector.<Number>(N/2);
            for (i = 0; i < N/2; i++) m_freqs[i] = i*SAMPLE_RATE/N;
 
            // Hanning analysis window
            m_win = new Vector.<Number>(N);
            for (i = 0; i < N; i++) m_win[i] = (4.0/N) * 0.5*(1-Math.cos(2*Math.PI*i/N));
 
            // Create a buffer for the input audio
            m_buf = new Vector.<Number>(BUF_LEN);
            for (i = 0; i < BUF_LEN; i++) m_buf[i] = 0.0;
 
            // Set up microphone input
			m_mic = Microphone.getMicrophone();
			m_mic.rate = SAMPLE_RATE/1000;
			m_mic.setSilenceLevel(0.0);         // Have the mic run non-stop, regardless of the input level
			m_mic.addEventListener(SampleDataEvent.SAMPLE_DATA, onMicSampleData);
        }

		/**
		 * If the microphone is not allowed, shows the settings dialog.
		 * Once microphone is enabled, invokes callback.
		 * 
		 * @param settingsScreenVisibilityCheck is a function which returns true if the settings screen 
		 *                                           is already on stage (and thus does not need to be re-shown).
		 */ 
		public function ensureMicrophoneEnabled(callback: Function = null, settingsScreenVisibilityCheck: Function = null):void {
			m_microphoneEnabledCallback = callback;
			m_settingsScreenVisibilityCheck = settingsScreenVisibilityCheck;
			if (!m_mic.muted) {
				if (callback != null) callback();
			}
			else {
				m_microphoneEnabledTimer = new Timer(500);
				m_microphoneEnabledTimer.addEventListener(TimerEvent.TIMER, waitForMicEnabled);
				m_microphoneEnabledTimer.start();
			}
		}
		
		private function waitForMicEnabled(event: Event):void {
			if (!m_mic.muted) {
				m_microphoneEnabledTimer.stop();
				if(m_microphoneEnabledCallback != null) m_microphoneEnabledCallback();
			}
			else {
				if (m_settingsScreenVisibilityCheck == null || !m_settingsScreenVisibilityCheck())
					Security.showSettings(SecurityPanel.PRIVACY);
			}
		}
		
        /**
         * Called whether new microphone input data is available. See this call
         * above:
         *    m_mic.addEventListener( SampleDataEvent.SAMPLE_DATA, onMicSampleData );
         */
        private function onMicSampleData(event:SampleDataEvent):void {
            // Get number of available input samples
            var len:uint = event.data.length/4;
 
            // Read the input data and stuff it into
            // the circular buffer
            for (var i:uint = 0; i < len; i++) {
                m_buf[m_writePos] = event.data.readFloat();
                m_writePos = (m_writePos+1)%BUF_LEN;
            }
        }
 
		/**
		 * Accessor to the internal microphone object (in case you want to tune something)
		 */
		public function getMicrophone():Microphone {
			return m_mic;
		}
		
		/**
		 * Accessor to the frequencies array. frequencies[i] keeps the frequency, corresponding to spectrum magnitude bin [i]
		 */		
		public function getFrequencies():Vector.<Number> {
			return m_freqs;
		}
		
		/**
		 * Can be called at any time, to obtain the most recent window of raw sound data
		 * @param useWindow  when true, the sound samples are premultiplied with a Hanning analysis window.
		 */
		public function getWave(useWindow:Boolean = false):Vector.<Number> {
            // Copy data from circular microphone audio
            // buffer into temporary buffer for FFT, while
            // applying Hanning window.
            var i:int;
            var pos:uint = m_writePos;
			if (useWindow) {
	            for ( i = 0; i < N; i++ ) {
	                m_tempRe[i] = m_win[i]*m_buf[pos];
	                pos = (pos+1)%BUF_LEN;
	             }
			}
			else {
	            for ( i = 0; i < N; i++ ) {
	                m_tempRe[i] = m_win[i];
	                pos = (pos+1)%BUF_LEN;
	             }				
			}
			return m_tempRe;
		}
		
		/**
		 * Can be called at any time, to obtain the magnitude spectrum of the most recent data window.
		 * @param useWindow  when true, the sound samples are premultiplied with a Hanning analysis window.
		 * @param scaling    when true, magnitude is log-scaled to decibels.
		 */		
		public function getSpectrumMagnitude(useWindow:Boolean = true, scaling:Boolean = true):Vector.<Number> {
			// Read sound data
			m_tempRe = getWave(useWindow);
			
			// Zero out the imaginary component
			var i:int;			
            for (i = 0; i < N; i++) m_tempIm[i] = 0.0; 
 
            // Do FFT and get magnitude spectrum
            m_fft.run(m_tempRe, m_tempIm);
            for (i = 0; i < N/2; i++ ) {
                var re:Number = m_tempRe[i];
                var im:Number = m_tempIm[i];
                m_mag[i] = Math.sqrt(re*re + im*im);
            }
 
            // Convert to dB magnitude
            const SCALE:Number = 20/Math.LN10;
            for (i = 0; i < N/2; i++) {
                // 20 log10(mag) => 20/ln(10) ln(mag)
                // Addition of MIN_VALUE prevents log from returning minus infinity if mag is zero
                m_mag[i] = SCALE*Math.log( m_mag[i] + Number.MIN_VALUE );
            }
 			return m_mag;
		}
    }
}