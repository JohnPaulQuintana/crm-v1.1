WITH gvars as (
  SELECT 
    'BDT' as currency 
    ,'Sport' as game_type
    ,'2025-08-24' as start_date 
    ,'2025-08-25' as end_date
)

SELECT 
  account_user_id 
  ,currency_type_name 
  ,game_type_name 
  ,sum(turnover) as turnover 
  ,sum(profit_loss) *-1 as company_pnl
FROM ads_mcd_bj_game_transaction_account_game_day_agg 
WHERE currency_type_name = (SELECT currency FROM gvars)
AND settle_date_id BETWEEN (SELECT start_date FROM gvars) AND (SELECT end_date FROM gvars)
AND game_type_name = (SELECT game_type FROM gvars)

GROUP BY 1,2,3