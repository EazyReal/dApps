import { Loading, PageLayout } from "@cosmicdapp/design";
import { displayAmountToNative, getErrorFromStackTrace, useSdk } from "@cosmicdapp/logic";
import { Coin, coins } from "@cosmjs/launchpad";
import { isBroadcastTxFailure } from "@cosmjs/stargate";
import { Typography } from "antd";
import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { config } from "../../../config";
import { HeaderBackMenu } from "../../components/HeaderBackMenu";
import { pathOperationResult, pathValidator, pathWallet, pathWithdraw } from "../../paths";
import { EncodeMsgUndelegate, useStakingValidator } from "../../utils/staking";
import { FormWithdrawBalance, FormWithdrawBalanceFields } from "./FormWithdrawBalance";
import { HeaderTitleStack, MainStack } from "./style";

const { Title } = Typography;

interface WithdrawParams {
  readonly validatorAddress: string;
}

export function Withdraw(): JSX.Element {
  const [loading, setLoading] = useState(false);

  const history = useHistory();
  const { validatorAddress } = useParams<WithdrawParams>();
  const { getClient, address, refreshBalance } = useSdk();

  const validator = useStakingValidator(validatorAddress);

  async function submitWithdrawBalance({ amount }: FormWithdrawBalanceFields) {
    setLoading(true);
    const nativeAmountString = displayAmountToNative(amount, config.coinMap, config.stakingToken);
    const nativeAmountCoin: Coin = { amount: nativeAmountString, denom: config.stakingToken };

    const undelegateMsg: EncodeMsgUndelegate = {
      typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
      value: {
        delegatorAddress: address,
        validatorAddress: validatorAddress,
        amount: nativeAmountCoin,
      },
    };

    const fee = {
      amount: coins(
        config.gasPrice * 10 ** config.coinMap[config.feeToken].fractionalDigits,
        config.feeToken,
      ),
      gas: "1500000",
    };

    try {
      const response = await getClient().signAndBroadcast(address, [undelegateMsg], fee);
      if (isBroadcastTxFailure(response)) {
        throw Error("Withdrawal failed");
      }

      refreshBalance();

      history.push({
        pathname: pathOperationResult,
        state: {
          success: true,
          message: `${amount} ${config.stakingToken} successfully undelegated`,
          customButtonText: "Wallet",
          customButtonActionPath: `${pathWallet}/${validatorAddress}`,
        },
      });
    } catch (stackTrace) {
      console.error(stackTrace);

      history.push({
        pathname: pathOperationResult,
        state: {
          success: false,
          message: "Undelegate transaction failed:",
          error: getErrorFromStackTrace(stackTrace),
          customButtonActionPath: `${pathWithdraw}/${validatorAddress}`,
        },
      });
    }
  }

  return (
    (loading && <Loading loadingText={`Undelegating...`} />) ||
    (!loading && (
      <PageLayout>
        <MainStack>
          <HeaderTitleStack>
            <HeaderBackMenu path={`${pathValidator}/${validatorAddress}`} />
            <Title>Withdraw</Title>
            <Title level={2}>{validator?.description.moniker ?? ""}</Title>
          </HeaderTitleStack>
          <FormWithdrawBalance validator={validator} submitWithdrawBalance={submitWithdrawBalance} />
        </MainStack>
      </PageLayout>
    ))
  );
}
