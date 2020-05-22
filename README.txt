Each trading strategy has the following modules
1. datapipes: these can be thought of as modules which send the live data to the
trading system.
2. Trade Management: this module deals with managing the risk and position
sizing so that no one bad trade wipes the account, stopLoss, TakeProfit.
3. Signal Generation: trading rule is the rule which gives the signal of buy and
sell.
4. logger: the logger logs the trade details
5. error logger: logs the erros while execution
6. order placement: places the orde

#####rough schematics###########


		----------------------
	   dataPipes(one or more)
		----------------------
				|||
				VVV
			----------
			Connector |
			----------
				|||
				VVV
------------------------------------------------------
signalGenerator(generates the signal based on the data)
------------------------------------------------------
				|||
				VVV
			----------
			Connector
			----------
				|||
				VVV
		----------------
		trademanagement
		----------------
				|||
				VVV
			----------
		   | Connector |
			----------
				|||
				VVV
			-------------
			tradePlacement
			-------------
				|||
				VVV
			----------
			Connector
			----------
				|||
				VVV
			   ------
			   logger
			   ------ 





