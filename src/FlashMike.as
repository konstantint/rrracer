/**
 * Flash-based simplistic pitch-detection component.
 * 
 * Copyright (c) Konstantin Tretyakov.
 * 
 * Released under MIT Licence.
 */
package
{
    import __AS3__.vec.Vector;
    import flash.display.Sprite;
    import flash.events.*;
    import flash.media.Microphone;
    import flash.text.*;
    import flash.utils.*;
 
    [SWF(width='600', height='400', frameRate='30', backgroundColor='0xFFFFFF')]
    public class FlashMike extends Sprite
     {
		private var m_pitch:PitchDetector;
		private var m_mic:MicrophoneListener;
		
        private const UPDATE_PERIOD:int = 50;       // Period of spectrum updates (ms)

        private var m_tickTextAdded:Boolean = false;
        private var m_timer:Timer;                  // Timer for updating spectrum
 
		private var m_currentSpectrum:Vector.<Number>;
		private var m_currentPitch:Number;
		private var m_frequencies:Vector.<Number>;
		
		private var m_pitchText:TextField;
			
        public function FlashMike() {
			m_mic = new MicrophoneListener();
			m_pitch = new PitchDetector(m_mic);
			m_frequencies = m_mic.getFrequencies();
			m_pitchText = new TextField();
			
            // Set up a timer to do periodic updates of the spectrum
            m_timer = new Timer(UPDATE_PERIOD);
            m_timer.addEventListener(TimerEvent.TIMER, updateSpectrum);
            m_timer.start();
        }
  
        /**
         * Called at regular intervals to update the spectrum
         */
        private function updateSpectrum( event:Event ):void  {
			m_currentSpectrum = getProcessedSpectrum();
			m_currentPitch = m_pitch.getPitch();
			render();
         }

		private function getProcessedSpectrum():Vector.<Number> {
            var spectrum:Vector.<Number> = m_mic.getSpectrumMagnitude();
			for (var i:int = 0; i < spectrum.length; i++) {
				if (spectrum[i] < -30) spectrum[i] = -60;
			}
			return spectrum;
		}
 
        /**
         * Draw a graph of the spectrum
         */
        private function render():void  {
	
			var mag:Vector.<Number> = m_currentSpectrum;
            var freq:Vector.<Number> = m_frequencies;

            // Basic constants
            const MIN_FREQ:Number = 0;                  // Minimum frequency (Hz) on horizontal axis.
            const MAX_FREQ:Number = 4000;               // Maximum frequency (Hz) on horizontal axis.
            const FREQ_STEP:Number = 500;               // Interval between ticks (Hz) on horizontal axis.
            const MAX_DB:Number = -0.0;                 // Maximum dB magnitude on vertical axis.
            const MIN_DB:Number = -60.0;                // Minimum dB magnitude on vertical axis.
            const DB_STEP:Number = 10;                  // Interval between ticks (dB) on vertical axis.
            const TOP:Number  = 50;                     // Top of graph
            const LEFT:Number = 60;                     // Left edge of graph
            const HEIGHT:Number = 300;                  // Height of graph
            const WIDTH:Number = 500;                   // Width of graph
            const TICK_LEN:Number = 10;                 // Length of tick in pixels
            const LABEL_X:String = "Frequency (Hz)";    // Label for X axis
            const LABEL_Y:String = "dB";                // Label for Y axis
 
            // Derived constants
            const BOTTOM:Number = TOP+HEIGHT;                   // Bottom of graph
            const DBTOPIXEL:Number = HEIGHT/(MAX_DB-MIN_DB);    // Pixels/tick
            const FREQTOPIXEL:Number = WIDTH/(MAX_FREQ-MIN_FREQ);// Pixels/Hz
 
            //-----------------------
 
            var i:uint;
            var numPoints:uint;
 
            numPoints = mag.length;
            if ( mag.length != freq.length )
                trace( "mag.length != freq.length" );
 
            graphics.clear();
 
            // Draw a rectangular box marking the boundaries of the graph
            graphics.lineStyle( 1, 0x000000 );
            graphics.drawRect( LEFT, TOP, WIDTH, HEIGHT );
            graphics.moveTo(LEFT, TOP+HEIGHT);
 
            //--------------------------------------------
 
            // Tick marks on the vertical axis
            var y:Number;
            var x:Number;
            for ( var dBTick:Number = MIN_DB; dBTick <= MAX_DB; dBTick += DB_STEP )
            {
                y = BOTTOM - DBTOPIXEL*(dBTick-MIN_DB);
                graphics.moveTo( LEFT-TICK_LEN/2, y );
                graphics.lineTo( LEFT+TICK_LEN/2, y );
                if ( m_tickTextAdded == false )
                {
                    // Numbers on the tick marks
                    var t:TextField = new TextField();
                    t.text = int(dBTick).toString();
                    t.width = 0;
                    t.height = 20;
                    t.x = LEFT-20;
                    t.y = y - t.textHeight/2;
                    t.autoSize = TextFieldAutoSize.CENTER;
                    addChild(t);
                }
             }
 
            // Label for vertical axis
            if ( m_tickTextAdded == false ) {
                t = new TextField();
                t.text = LABEL_Y;
                t.x = LEFT-50;
                t.y = TOP + HEIGHT/2 - t.textHeight/2;
                t.height = 20;
                t.width = 50;
                //t.rotation = -90;
                addChild(t);
            }
 
            //--------------------------------------------
 
            // Tick marks on the horizontal axis
            for ( var f:Number = MIN_FREQ; f <= MAX_FREQ; f += FREQ_STEP )
            {
                x = LEFT + FREQTOPIXEL*(f-MIN_FREQ);
                graphics.moveTo( x, BOTTOM - TICK_LEN/2 );
                graphics.lineTo( x, BOTTOM + TICK_LEN/2 );
                if ( m_tickTextAdded == false )
                {
                    t = new TextField();
                    t.text = int(f).toString();
                    t.width = 0;
                    t.x = x;
                    t.y = BOTTOM+7;
                    t.autoSize = TextFieldAutoSize.CENTER;
                    addChild(t);
                }
            }
 
            // Label for horizontal axis
            if ( m_tickTextAdded == false )
            {
                t = new TextField();
                t.text = LABEL_X;
                t.width = 0;
                t.x = LEFT+WIDTH/2;
                t.y = BOTTOM+30;
                t.autoSize = TextFieldAutoSize.CENTER;
                addChild(t);
            }

			// Current pitch
			if (m_tickTextAdded == false) {
				m_pitchText.x = LEFT + WIDTH / 2;
				m_pitchText.y = TOP + HEIGHT / 2;
				m_pitchText.autoSize = TextFieldAutoSize.CENTER;			
				addChild(m_pitchText);
			}
			m_pitchText.text = (m_currentPitch == -1) ? "No pitch detected" : m_currentPitch.toString();
 
            m_tickTextAdded = true;
 

            // -------------------------------------------------
            // The line in the graph
 
            // Ignore points that are too far to the left
            for ( i = 0; i < numPoints && freq[i] < MIN_FREQ; i++ )
            {
            }
 
            // For all remaining points within range of x-axis
            var firstPoint:Boolean = true;
            for ( /**/; i < numPoints && freq[i] <= MAX_FREQ; i++ )
            {
                // Compute horizontal position
                x = LEFT + FREQTOPIXEL*(freq[i]-MIN_FREQ);
 
                // Compute vertical position of point
                // and clip at top/bottom.
                y = BOTTOM - DBTOPIXEL*(mag[i]-MIN_DB);
                if ( y < TOP )
                    y = TOP;
                else if ( y > BOTTOM )
                    y = BOTTOM;
 
                // If it's the first point
                if ( firstPoint )
                {
                    // Move to the point
                    graphics.moveTo(x,y);
                    firstPoint = false;
                }
                else
                {
                    // Otherwise, draw line from the previous point
                    graphics.lineTo(x,y);
                }
            }
        }
    }
}