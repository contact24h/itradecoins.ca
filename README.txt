Each trading strategy has the following modules
1. datapipes: these can be thought of as modules which send the live data to the
trading system.
2. Money management: this module deals with managing the risk and position
sizing so that no one bad trade wipes the account.
3. Trading rule: trading rule is the rule which gives the signal of buy and
sell.
4. Trade Management:has two sub modules, take profit and stop loss. This module
is activated depending on whether trade is active or not.
5. logger: the logger logs the trade details
6. error logger: logs the erros while execution
7. order placement: places the orde
7.  whenever a new price update is given, the upate triggers something like
setState in react and 


dataPipes
Connector
signalGenerator
Connector
trademanagement
Connector
tradePlacement
logger
error logger

const tm = new tradeManagement()
tm.takeActionBasedOnSignal()

const dp = new DataPipe()



