import React from "react";
import Chart from "chart.js";
import { bindActionCreators } from "redux"; // TODO: do we really need this or shall we use the store directly?
import { connect } from "react-redux";
import { connectWeb3 } from "modules/web3Provider";
import BigNumber from "bignumber.js";
import augmintTokenProvider from "modules/augmintTokenProvider";
import ratesProvider from "modules/ratesProvider";
import loanManagerProvider from "modules/loanManagerProvider";
import lockManagerProvider from "modules/lockManagerProvider";
import metricsProvider from "modules/metricsProvider";
import { refreshAugmintToken } from "modules/reducers/augmintToken";
import { Pheader } from "components/PageLayout";
import { EthereumState } from "containers/app/EthereumState";
import TopNavTitlePortal from "components/portals/TopNavTitlePortal";
import { MyListGroup } from "components/MyListGroups";
import { ErrorPanel } from "components/MsgPanels";
import Segment from "components/augmint-ui/segment";
import Button from "components/augmint-ui/button";

import { StyledContainer, StyledHeader, StyledMyListGroup, StyledRow, StyledCol } from "./styles";
import theme from "styles/theme";
import { theme as mediaTheme } from "styles/media";
import { ThemeProvider } from "styled-components";

class AugmintToken extends React.Component {
    componentDidMount() {
        connectWeb3();
        ratesProvider();
        augmintTokenProvider();
        loanManagerProvider();
        lockManagerProvider();
        metricsProvider();
    }

    handleAugmintTokenRefreshClick = e => {
        e.preventDefault();
        this.props.refreshAugmintToken();
    };

    render() {
        let loansCollected = "?",
            amountOwnedByUsers = "?",
            amountOwnedByUsersLiquid = "?",
            loanCollateralCoverageRatio = "?",
            collateralInEscrow = "?",
            availableForMarketIntervention = "?",
            bn_collateralInEscrowEth = 1,
            bn_outstandingLoansAmount = 1;

        const { metrics, monetarySupervisor, rates, loanManager, lockManager, augmintToken } = this.props;

        const aurSupplyError = metrics.error || monetarySupervisor.loadError || augmintToken.error;
        const ethReservesError = monetarySupervisor.loadError || metrics.error;
        const stabilityRatiosError = rates.loadError || metrics.error || monetarySupervisor.loadError;

        if (Object.keys(metrics.loansData).length) {
            loansCollected = new BigNumber(metrics.loansData.collectedLoansAmount.toFixed(15))
                .plus(metrics.loansData.defaultedLoansAmount)
                .toNumber();
        }

        if (
            metrics.augmintTokenInfo.totalSupply !== undefined &&
            metrics.monetarySupervisorInfo.reserveTokenBalance !== undefined &&
            metrics.augmintTokenInfo.feeAccountTokenBalance !== undefined &&
            metrics.monetarySupervisorInfo.interestEarnedAccountTokenBalance !== undefined
        ) {
            const bn_amountOwnedByUsers = new BigNumber(metrics.augmintTokenInfo.totalSupply.toFixed(15))
                .minus(metrics.monetarySupervisorInfo.reserveTokenBalance)
                .minus(metrics.augmintTokenInfo.feeAccountTokenBalance)
                .minus(metrics.monetarySupervisorInfo.interestEarnedAccountTokenBalance);

            amountOwnedByUsers = bn_amountOwnedByUsers.toFixed(2);
            amountOwnedByUsersLiquid = bn_amountOwnedByUsers
                .minus(monetarySupervisor.info.totalLockedAmount)
                .toFixed(2);
        }

        if (
            metrics.loansData.collateralInEscrowEth &&
            metrics.loansData.outstandingLoansAmount &&
            rates.info.bn_ethFiatRate
        ) {
            bn_collateralInEscrowEth = new BigNumber(metrics.loansData.collateralInEscrowEth.toFixed(15));
            bn_outstandingLoansAmount = new BigNumber(metrics.loansData.outstandingLoansAmount.toFixed(15));
            let bn_collateralInEscrow = rates.info.bn_ethFiatRate.mul(bn_collateralInEscrowEth);
            collateralInEscrow = bn_collateralInEscrow.toFixed(2);

            loanCollateralCoverageRatio = bn_collateralInEscrow
                .div(bn_outstandingLoansAmount)
                .mul(100)
                .toFixed(2);
        }

        if (
            metrics.monetarySupervisorInfo.reserveEthBalance !== undefined &&
            metrics.augmintTokenInfo.feeAccountEthBalance !== undefined
        ) {
            availableForMarketIntervention = new BigNumber(metrics.monetarySupervisorInfo.reserveEthBalance.toFixed(15))
                .plus(metrics.augmintTokenInfo.feeAccountEthBalance)
                .toNumber();
        }

        let loanLimit = 0;
        const loanProductsList =
            loanManager &&
            loanManager.products &&
            loanManager.products.map((product, index) => {
                if (index === 0) {
                    loanLimit = product.maxLoanAmount;
                }
                if (product.maxLoanAmount < loanLimit) {
                    loanLimit = product.maxLoanAmount;
                }
                return (
                    <div key={"reserv-page-loan-" + index}>
                        {product.isActive && (
                            <StyledRow halign="justify">
                                <StyledCol width={1 / 2}>{product.termText}</StyledCol>
                                <StyledCol width={1 / 2}>{product.interestRatePaPt}%</StyledCol>
                            </StyledRow>
                        )}
                    </div>
                );
            });
        let lockLimit = 0;
        const lockProductsList =
            lockManager &&
            lockManager.products &&
            lockManager.products.map((product, index) => {
                if (index === 0) {
                    lockLimit = product.maxLockAmount;
                }
                if (product.maxLockAmount < loanLimit) {
                    lockLimit = product.maxLockAmount;
                }
                return (
                    <div key={"reserv-page-lock-" + index}>
                        {product.isActive && (
                            <StyledRow halign="justify">
                                <StyledCol width={1 / 2} className="alignLeft">
                                    {product.durationText}
                                </StyledCol>
                                <StyledCol width={1 / 2}>{product.interestRatePaPt}%</StyledCol>
                            </StyledRow>
                        )}
                    </div>
                );
            });
        if (
            metrics.loansData.outstandingLoansAmount > -1 &&
            loansCollected > -1 &&
            metrics.monetarySupervisorInfo.issuedByStabilityBoard > -1 &&
            document.getElementById("marketSupply-1")
        ) {
            let ctx = document.getElementById("marketSupply-1").getContext("2d");
            new Chart(ctx, {
                type: "pie",
                data: {
                    labels: ["Loans Outstanding (A€)", "Loans Collected (A€)", "Issued by Stability Board (A€)"],
                    datasets: [
                        {
                            label: " A€",
                            data: [
                                metrics.loansData.outstandingLoansAmount,
                                loansCollected,
                                metrics.monetarySupervisorInfo.issuedByStabilityBoard
                            ],
                            backgroundColor: [theme.chartColors.blue, theme.chartColors.orange, theme.chartColors.red],
                            borderColor: [theme.chartColors.blue, theme.chartColors.orange, theme.chartColors.red],
                            borderWidth: 0
                        }
                    ]
                },
                options: {
                    legend: {
                        display: false
                    }
                }
            });
        }
        if (
            metrics.monetarySupervisorInfo.reserveTokenBalance > -1 &&
            metrics.augmintTokenInfo.feeAccountTokenBalance > -1 &&
            metrics.monetarySupervisorInfo.interestEarnedAccountTokenBalance > -1 &&
            monetarySupervisor.info.totalLockedAmount > -1 &&
            amountOwnedByUsersLiquid > -1 &&
            document.getElementById("marketSupply-2")
        ) {
            let ctx = document.getElementById("marketSupply-2").getContext("2d");
            const data = new BigNumber(metrics.monetarySupervisorInfo.reserveTokenBalance)
                .plus(metrics.augmintTokenInfo.feeAccountTokenBalance)
                .plus(metrics.monetarySupervisorInfo.interestEarnedAccountTokenBalance)
                .toNumber();
            new Chart(ctx, {
                type: "pie",
                data: {
                    labels: ["Owned by Augmint (A€)", "Locked-in (A€)", "Liquid Amount Owned by Users (A€)"],
                    datasets: [
                        {
                            label: " A€",
                            data: [data, monetarySupervisor.info.totalLockedAmount, amountOwnedByUsersLiquid],
                            backgroundColor: [theme.chartColors.orange, theme.chartColors.red, theme.chartColors.green],
                            borderColor: [theme.chartColors.orange, theme.chartColors.red, theme.chartColors.green],
                            borderWidth: 0
                        }
                    ]
                },
                options: {
                    legend: {
                        display: false
                    }
                }
            });
        }

        return (
            <EthereumState>
                <ThemeProvider theme={mediaTheme}>
                    <StyledContainer>
                        <TopNavTitlePortal>
                            <Pheader header="Stability Dashboard" />
                        </TopNavTitlePortal>
                        <Segment
                            loading={metrics.isLoading || monetarySupervisor.isLoading || augmintToken.isLoading}
                            style={{ color: "black" }}
                        >
                            {(metrics.error || monetarySupervisor.loadError || augmintToken.error) && (
                                <ErrorPanel header="Error while fetching data">{aurSupplyError.message}</ErrorPanel>
                            )}
                            <StyledHeader as="h3">A-EUR Supply</StyledHeader>
                            <StyledMyListGroup>
                                <StyledRow wrap={true} valign="stretch">
                                    <StyledCol width={{ tablet: 1, desktop: 3 / 5, giant: 2 / 5 }}>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>+ Loans Outstanding</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.loansData.outstandingLoansAmount !== undefined
                                                        ? Number(metrics.loansData.outstandingLoansAmount).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info blue" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>+ Loans Collected</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(loansCollected !== "?"
                                                        ? Number(loansCollected).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info orange" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>+ Issued by Stability Board (Net)</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(monetarySupervisor.info.issuedByStabilityBoard !== "?"
                                                        ? Number(
                                                              monetarySupervisor.info.issuedByStabilityBoard
                                                          ).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info red" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="borderTop result">
                                                <StyledCol width={2 / 3}>Total</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.augmintTokenInfo.totalSupply !== undefined
                                                        ? Number(metrics.augmintTokenInfo.totalSupply).toFixed(0)
                                                        : "?") + " A€"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                    </StyledCol>
                                    <StyledCol width={{ tablet: 1, desktop: 2 / 5, giant: 3 / 5 }}>
                                        <canvas id="marketSupply-1" />
                                    </StyledCol>
                                </StyledRow>
                                <StyledRow className="borderTop" wrap={true} valign="stretch">
                                    <StyledCol width={{ tablet: 1, desktop: 3 / 5, giant: 2 / 5 }}>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>- A-EUR Market Intervention Reserve</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.monetarySupervisorInfo.reserveTokenBalance !== undefined
                                                        ? Number(
                                                              metrics.monetarySupervisorInfo.reserveTokenBalance
                                                          ).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info orange" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>- Fees Reserve</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.augmintTokenInfo.feeAccountTokenBalance !== undefined
                                                        ? Number(
                                                              metrics.augmintTokenInfo.feeAccountTokenBalance
                                                          ).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info orange" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>- Earned Interest Reserve</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.monetarySupervisorInfo
                                                        .interestEarnedAccountTokenBalance !== undefined
                                                        ? Number(
                                                              metrics.monetarySupervisorInfo
                                                                  .interestEarnedAccountTokenBalance
                                                          ).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info orange" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="borderTop result">
                                                <StyledCol width={2 / 3}>Amount Owned by Users</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(amountOwnedByUsers !== "?"
                                                        ? Number(amountOwnedByUsers).toFixed(0)
                                                        : "?") + " A€"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <br />
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>- Locked-in Amount</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(monetarySupervisor.info.totalLockedAmount !== "?"
                                                        ? Number(monetarySupervisor.info.totalLockedAmount).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info red" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="borderTop result">
                                                <StyledCol width={2 / 3}>Amount Owned by Users (Liquid)</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(amountOwnedByUsersLiquid !== "?"
                                                        ? Number(amountOwnedByUsersLiquid).toFixed(0)
                                                        : "?") + " A€"}
                                                    <div className="chart-info green" />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                    </StyledCol>
                                    <StyledCol width={{ tablet: 1, desktop: 2 / 5, giant: 3 / 5 }}>
                                        <canvas id="marketSupply-2" />
                                    </StyledCol>
                                </StyledRow>
                            </StyledMyListGroup>
                        </Segment>
                        <Segment loading={monetarySupervisor.isLoading || metrics.isLoading} style={{ color: "black" }}>
                            {(monetarySupervisor.loadError || metrics.error) && (
                                <ErrorPanel header="Error while fetching data">{ethReservesError.message}</ErrorPanel>
                            )}
                            <StyledHeader as="h3">ETH Reserves</StyledHeader>
                            <StyledMyListGroup>
                                <StyledRow>
                                    <StyledCol width={{ tablet: 1, desktop: 3 / 5, giant: 2 / 5 }}>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>ETH Market Intervention Reserve</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.monetarySupervisorInfo.reserveEthBalance !== undefined
                                                        ? Number(
                                                              metrics.monetarySupervisorInfo.reserveEthBalance
                                                          ).toFixed(4)
                                                        : "?") + " ETH"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3}>ETH Fees</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.augmintTokenInfo.feeAccountEthBalance !== undefined
                                                        ? Number(metrics.augmintTokenInfo.feeAccountEthBalance).toFixed(
                                                              4
                                                          )
                                                        : "?") + " ETH"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="borderTop result">
                                                <StyledCol width={2 / 3}>Total</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(availableForMarketIntervention !== "?"
                                                        ? Number(availableForMarketIntervention).toFixed(4)
                                                        : "?") + " ETH"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                    </StyledCol>
                                </StyledRow>
                            </StyledMyListGroup>
                        </Segment>
                        <Segment
                            loading={rates.isLoading || metrics.isLoading || monetarySupervisor.isLoading}
                            style={{ color: "black" }}
                        >
                            {(rates.loadError || metrics.error || monetarySupervisor.loadError) && (
                                <ErrorPanel header="Error while fetching data">
                                    {stabilityRatiosError.message}
                                </ErrorPanel>
                            )}
                            <StyledHeader as="h3">Stability Ratios</StyledHeader>
                            <StyledMyListGroup>
                                <StyledRow>
                                    <StyledCol width={{ tablet: 1, desktop: 3 / 5, giant: 2 / 5 }}>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="result">
                                                <StyledCol width={2 / 3}>Collateral Coverage Ratio</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(loanCollateralCoverageRatio !== "?"
                                                        ? loanCollateralCoverageRatio
                                                        : "? ") + "%"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3} style={{ marginLeft: 20 }}>
                                                    Loans Outstanding
                                                </StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.loansData.outstandingLoansAmount !== undefined
                                                        ? Number(metrics.loansData.outstandingLoansAmount).toFixed(0)
                                                        : "?") + " A€"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3} style={{ marginLeft: 20 }}>
                                                    Collateral in escrow
                                                </StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(metrics.loansData.collateralInEscrowEth !== undefined
                                                        ? Number(metrics.loansData.collateralInEscrowEth).toFixed(4)
                                                        : "?") + " ETH "}
                                                    <span className="collateralInEscrow">
                                                        (
                                                        {(collateralInEscrow !== "?"
                                                            ? Number(collateralInEscrow).toFixed(0)
                                                            : "?") + " A€"}
                                                        )
                                                    </span>
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify" className="result">
                                                <StyledCol width={2 / 3}>Loan To Lock-in Ratio</StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(monetarySupervisor.info.ltdPercent !== "?"
                                                        ? ((monetarySupervisor.info.ltdPercent * 10000) / 100).toFixed(
                                                              2
                                                          )
                                                        : "? ") + "%"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3} style={{ marginLeft: 20 }}>
                                                    Active Loans
                                                </StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(monetarySupervisor.info.totalLoanAmount !== "?"
                                                        ? Number(monetarySupervisor.info.totalLoanAmount).toFixed(0)
                                                        : "?") + " A€"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                        <MyListGroup>
                                            <StyledRow halign="justify">
                                                <StyledCol width={2 / 3} style={{ marginLeft: 20 }}>
                                                    Active Lock-ins
                                                </StyledCol>
                                                <StyledCol width={1 / 3}>
                                                    {(monetarySupervisor.info.totalLockedAmount !== "?"
                                                        ? Number(monetarySupervisor.info.totalLockedAmount).toFixed(0)
                                                        : "?") + " A€"}
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                    </StyledCol>
                                </StyledRow>
                            </StyledMyListGroup>
                        </Segment>
                        <Segment>
                            <StyledHeader as="h3">Loan & Lock Conditions</StyledHeader>
                            <StyledMyListGroup>
                                <StyledRow>
                                    <StyledCol
                                        width={{ tablet: 1, desktop: 3 / 5, giant: 2 / 5 }}
                                        style={{ padding: "0 0 .5em" }}
                                    >
                                        <MyListGroup>
                                            <StyledRow halign="justify" valign="stretch" wrap={true}>
                                                <StyledCol
                                                    width={{ tablet: 1, desktop: 1 / 2 }}
                                                    style={{ padding: "0 15px", marginTop: 15 }}
                                                >
                                                    <MyListGroup>
                                                        <StyledRow halign="justify" className="result">
                                                            <StyledCol
                                                                className="center"
                                                                style={{ padding: "0 0 .5em" }}
                                                            >
                                                                Loans
                                                            </StyledCol>
                                                        </StyledRow>
                                                        <StyledRow halign="justify">
                                                            <StyledCol width={3 / 5}>Loan Limit</StyledCol>
                                                            <StyledCol width={2 / 5}>{loanLimit + " A€"}</StyledCol>
                                                        </StyledRow>
                                                        <br />
                                                        <StyledRow halign="justify" className="result smaller">
                                                            <StyledCol width={1 / 2}>Term</StyledCol>
                                                            <StyledCol width={1 / 2}>pa. Interest</StyledCol>
                                                        </StyledRow>
                                                        {loanProductsList}
                                                    </MyListGroup>
                                                </StyledCol>
                                                <StyledCol
                                                    width={{ tablet: 1, desktop: 1 / 2 }}
                                                    style={{ padding: "0 15px", marginTop: 15 }}
                                                >
                                                    <MyListGroup>
                                                        <StyledRow halign="justify" className="result">
                                                            <StyledCol
                                                                className="center"
                                                                style={{ padding: "0 0 .5em" }}
                                                            >
                                                                Lock-ins
                                                            </StyledCol>
                                                        </StyledRow>
                                                        <StyledRow halign="justify">
                                                            <StyledCol width={3 / 5} className="alignLeft">
                                                                Lock-in Limit
                                                            </StyledCol>
                                                            <StyledCol width={2 / 5}>{lockLimit + " A€"}</StyledCol>
                                                        </StyledRow>
                                                        <br />
                                                        <StyledRow halign="justify" className="result smaller">
                                                            <StyledCol width={1 / 2} className="alignLeft">
                                                                Term
                                                            </StyledCol>
                                                            <StyledCol width={1 / 2}>pa. Interest</StyledCol>
                                                        </StyledRow>
                                                        {lockProductsList}
                                                    </MyListGroup>
                                                </StyledCol>
                                            </StyledRow>
                                            <StyledRow>
                                                <StyledCol>
                                                    <Button
                                                        content="Loans to Collect"
                                                        data-testid="loansToCollectButton"
                                                        to="/loan/collect"
                                                        icon="angle-right"
                                                        labelposition="right"
                                                        size="large"
                                                        style={{ marginBottom: "15px" }}
                                                    />
                                                </StyledCol>
                                            </StyledRow>
                                        </MyListGroup>
                                    </StyledCol>
                                </StyledRow>
                            </StyledMyListGroup>
                        </Segment>
                    </StyledContainer>
                </ThemeProvider>
            </EthereumState>
        );
    }
}

const mapStateToProps = state => ({
    augmintToken: state.augmintToken,
    loanManager: state.loanManager,
    lockManager: state.lockManager,
    monetarySupervisor: state.monetarySupervisor,
    metrics: state.metrics,
    rates: state.rates
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            refreshAugmintToken
        },
        dispatch
    );

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AugmintToken);
