/**
 * Flash-based simplistic pitch-detection component.
 * 
 * Copyright (c) Konstantin Tretyakov.
 * 
 * Released under MIT Licence.
 */
package
{ 
    public class PitchDetector {
		private var m_cutoffLevel:Number;
		private var m_mic:MicrophoneListener;
		private var m_filter:MedianFilter;
		
        public function PitchDetector(mic:MicrophoneListener, cutoffLevel:Number = -40.0) {
			m_mic = mic;
			m_cutoffLevel = cutoffLevel;
			m_filter = new MedianFilter(5, -1);
         }

		public function getPitch():Number {
			var value:Number = computePitch();
			m_filter.update(value);
			return m_filter.value();
		}
		
		/**
		 * A very hackish pitch detection technique.
		 */  
		private function computePitch():Number {
            var spectrum:Vector.<Number> = m_mic.getSpectrumMagnitude();
			for (var i:int = 0; i < spectrum.length; i++) {
				if (spectrum[i] > m_cutoffLevel) return m_mic.getFrequencies()[i];
			}
			return -1;
		}		
    }
}