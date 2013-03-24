package {
	/**
	 * Simplistic median filter.
	 * @author Konstantin
	 */
	public class MedianFilter 
	{
		private var m_size:int;
		private var m_values:Vector.<Number>;
		private var m_copy:Vector.<Number>;
		private var m_currentPos:int;
		public function MedianFilter(size:int = 5, defaultValue:Number = -1) {
			m_size = size;
			m_values = new Vector.<Number>(size);
			m_copy = new Vector.<Number>(size);
			for (var i:int = 0; i < size; i++) m_values[i] = defaultValue;
			m_currentPos = 0;
		}
		
		public function update(value: Number):void {
			m_values[m_currentPos] = value;
			m_currentPos = (m_currentPos + 1) % m_size;
		}
		
		public function value():Number {
			for (var i:int = 0; i < m_size; i++) m_copy[i] = m_values[i];
			m_copy.sort(Array.DESCENDING);
			return m_copy[int(m_size/2)];
		}
	}

}