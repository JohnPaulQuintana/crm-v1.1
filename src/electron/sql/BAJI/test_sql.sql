WITH gvars AS ( -- ৫০% স্পোর্টস বেট ইন্স্যুরেন্স
  SELECT
    '৫০% স্পোর্টস বেট ইন্স্যুরেন্স' AS bonus_title
    ,'exc00002' AS bonus_code
    ,200 AS min_init_deposit
    ,TIMESTAMP '{{2025-08-11 00:00:00}}' AS start_date --localtime
    ,TIMESTAMP '{{2025-08-17 23:59:59}}' AS end_date  --localtime
)

,bonus_claimers AS (
  SELECT 
    bt.account_user_id 
    ,bt.currency_type_name 
    ,opt_in_tm
    ,init_deposit 
  FROM ads_mcd_bh_account_bonus_turnover bt 
  JOIN (SELECT
      account_user_id
      ,currency_type_name
      ,from_unixtime((MIN(create_time) / 1000) + 21600) AS opt_in_tm
    FROM ads_mcd_bh_account_bonus_turnover
    WHERE bonus_code = (SELECT bonus_code FROM gvars)
      AND bonus_title = (SELECT bonus_title FROM gvars)
      AND init_deposit >= (SELECT min_init_deposit FROM gvars)
      AND from_unixtime((create_time / 1000) + 21600)
          BETWEEN (SELECT start_date FROM gvars) AND (SELECT end_date FROM gvars)
    GROUP BY 1,2  ) bc
  ON bt.account_user_id = bc.account_user_id 
    AND opt_in_tm = from_unixtime((create_time / 1000) + 21600)
    AND bc.currency_type_name = bt.currency_type_name 
)

,game_data AS (
  SELECT 
    account_user_id
    ,currency_type_name
    ,profit_loss
    ,from_unixtime((settle_time / 1000) + 21600) AS settle_tm
    ,from_unixtime((txn_time / 1000) + 21600) AS txn_time
    ,CASE WHEN odds_type_name = 'US' THEN (match_avg_odds / 100) + 1 ELSE match_avg_odds END AS odds
    ,competition_name
  FROM ads_mcd_bh_sport_cricket_game_transaction 
  WHERE currency_type_name = '{{BDT}}'
    AND game_name_en like '%PremiumS%'
    AND competition_name IN ('The Hundred', 'Caribbean Premier League')
    AND system_txn_status_name = 'SETTLED'
    AND bonus_wallet_bet_type_name <> 'Bonus Wallet'
)

,game_txn AS (
  SELECT 
    opt_in_tm
    ,bc.account_user_id
    ,bc.currency_type_name
    ,init_deposit
    ,profit_loss
    ,txn_time
    ,settle_tm
    ,ROW_NUMBER() OVER (PARTITION BY bc.account_user_id, bc.currency_type_name ORDER BY txn_time ASC) AS txn_rank
  FROM bonus_claimers bc
  LEFT JOIN game_data gd
    ON bc.account_user_id = gd.account_user_id 
  WHERE txn_time BETWEEN opt_in_tm AND (SELECT end_date FROM gvars)
    AND settle_tm BETWEEN opt_in_tm AND (SELECT end_date FROM gvars)
    AND odds >= 1.3
)

SELECT
  user_id AS "Username"
  ,phone_number as "Phone Number" 
  ,profit_loss AS "First Bet Loss Amount"
  ,init_deposit as "Deposit Amount"
  ,CASE WHEN refund >= init_deposit THEN init_deposit 
    ELSE refund
  END as "Refund Amount"
FROM ( SELECT 
    account_user_id 
    ,opt_in_tm
    ,init_deposit
    ,profit_loss 
    ,txn_rank
    ,cast(abs(profit_loss) * 0.5 as DECIMAL(12,2)) as refund
  FROM game_txn ) ft
LEFT JOIN (SELECT user_id , is_phone_verified, phone_number FROM ads_mcd_bh_account)
ON user_id = account_user_id
WHERE txn_rank = 1
  and profit_loss < 0