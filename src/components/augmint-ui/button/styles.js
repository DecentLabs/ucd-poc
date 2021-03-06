import styled from "styled-components";
import { Link } from "react-router-dom";
import { default as theme, remCalc } from "styles/theme";
import { media } from "styles/media";

export const BaseButton = styledComponent => styledComponent`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    align-self: baseline;
    background-color: ${theme.colors.white};
    color: ${theme.colors.primary};
    cursor: pointer;
    text-transform: uppercase;
    font-weight: 200;
    margin: 0;
    padding: 10px 20px;
    border-radius: ${theme.borderRadius.all};
    font-size: 13px;
    letter-spacing: normal;
    border: 0;

    &:hover,
    &:focus {
      outline: 0;
      background-color: ${theme.colors.grey};
      color: ${theme.colors.white};

      &.primary {
        color: ${theme.colors.primary};
      }
    }

    &[disabled] {
      color: ${theme.colors.primary};
      cursor: default;
      opacity: .45;
      pointer-events: none;
    }

    &.hideIfDisables[disabled] {
      visibility: hidden;
    }

    &.dashboardColors {
      font-family: ${theme.typography.fontFamilies.title};
      font-size: ${remCalc(16)};
      text-transform: none;
      color: ${theme.colors.primary};
      background-color: ${theme.colors.secondary};

      &.fullwidth {
        width: 100%;
        height: 50px;
      }

      &:hover,
      &:focus {
        background-color: ${theme.colors.secondaryDark};
        
        ${media.tablet`
          &.accInfo {
            background-color: transparent;
            border: 1px solid ${theme.colors.primary};
          }
        `}
      }
    }

    &.primary {
      font-family: ${theme.typography.fontFamilies.title};
      font-size: ${remCalc(16)};
      text-transform: none;
      background-color: ${theme.colors.primary};
      color: ${theme.colors.white};

      ${media.tabletMin`
        padding: 20px 30px;
        font-size: ${remCalc(16)};
      `};

      &.myAcc {
        width: 203px;
        align-self: center;
        margin-top: 10px;

        ${media.tabletMin`
          width: 183px;
        `};
      }

      &.watchAssetBtn {
        margin-top: 25px;

        &.noMargin {
          margin-top: 0;
        }

        ${media.tabletMin`
          padding: 20px;
        `};
      }


    }

    &.wIcon {
      padding: 10px 15px;
    }

    &.ghost {
      font-family: ${theme.typography.fontFamilies.title};
      font-size: ${remCalc(16)};
      text-transform: none;
      background: transparent;
      border: 1px solid ${theme.colors.primary};
      color: ${theme.colors.primary};

      &.orange {
        color: ${theme.colors.secondary};
        background: none;
        border: 1px solid ${theme.colors.secondary};
      }

      &:hover,
      &:focus {
        background: transparent;
        background-color: ${theme.colors.primary};
        color: ${theme.colors.white};
        box-shadow: none;
      }

      &.orange:hover, &.orange:focus {
        border: 1px solid ${theme.colors.secondaryDark};
        background-color: transparent;
        color: ${theme.colors.secondaryDark};
      }
    }

    &.sansserif {
      font-family: ${theme.typography.fontFamilies.default};
    }

    &.naked {
      font-family: ${theme.typography.fontFamilies.title};
      text-transform: none;
      background: transparent;
      border: transparent;
      color: ${theme.colors.primary};

      &:hover,
      &:focus {
        background: transparent;
        color: ${theme.colors.primary};
        border-color: transparent;
        text-decoration: underline;
      }
    }

    &.grey {
      background-color: ${theme.colors.grey};
    }

    &.uth {
      margin-left: 101px;
      margin-bottom: 50px; 

      ${media.tablet`
        margin-left: 36px;
        margin-top: 23px;
      `};

      ${media.mobile`
        margin-left: 20px;
        margin-top: 25px;
        margin-bottom: 30px;
      `};
    }

    &.balanceBtn{
      width: 95%;
      box-sizing: border-box; 
      padding: 10px;
    }

    &.danger {
      background: ${theme.colors.red};
      color: ${theme.colors.white};
      padding: 10px 5px;
      :hover {
        background: ${theme.colors.darkRed};
      }
    }

    &.icon {      
      
      &.left {
        flex-direction: row-reverse;

        i {
          padding-right: 10px;
          height: 100%;
          margin: 0;
        }
      }

      &.right {

        i {
          padding-left: 10px;
          height: 100%;
          margin: 0;
        }
      }

      &.top {
        flex-direction: column-reverse;
        font-size: 1rem;
        ${media.mobile`
          font-size: .875rem;
        `};

        i {
          margin-top: 3px;
          margin-bottom: 6px;
        }
      }

      .circleBg {
        color: ${theme.colors.primary}
        background: ${theme.colors.secondary};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        text-align: center;
        line-height: 30px;
        vertical-align: middle;
      }

      i {
        &.bg {
          width: 3rem;
          background-color: rgba(0,0,0,.05);
        }
      }

    }

    &.loading {
      position: relative;
      cursor: default;
      text-shadow: none!important;
      color: transparent!important;
      opacity: 1;
      pointer-events: auto;
    }

    &.loading:after,
    &.loading:before {
      position: absolute;
      content: "";
      border-radius: 50%;
      top: 50%;
      left: 50%;
      margin: -9px 0 0 -9px;
      width: 18px;
      height: 18px;
    }

    &.loading:before {
      border: 3px solid rgba(0,0,0,.15);
    }

    &.loading:after {
      animation: button-spin .6s linear;
      animation-iteration-count: infinite;
      border-color: #fff transparent transparent;
      border-style: solid;
      border-width: 3px;
      box-shadow: 0 0 0 1px transparent;
    }

    &[labelposition="left"] {
      padding-left: 70px;
    }

    &[icon] {
      color: ${theme.colors.opacLighterGrey};
      position: relative;

      &.circle {
        color: ${theme.colors.primary};
      }
    }

    &[icon]:hover {
      background-color: white;
      color: ${theme.colors.opacLightGrey};
    }

    &[icon][labelposition="right"] {
      padding-right: 60px;
    }

    &[icon] i {
      position: absolute;
      height: 100%;
      margin: 0;
      width: 3rem;
      background-color: ${theme.colors.opacExtraLighterGrey};
      top: 0;
      left: 0;
    }

    &[icon] i:before {
      [iconsize="small"] {
        font-size: 1rem;
      }
      [iconsize="large"] {
        font-size: 25px;
      }
      display: block;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      text-align: center;
      width: 100%;


    }

    &[labelposition="right"] i {
      left: auto;
      right: 0;
      border-radius: 0;
      border-top-right-radius: inherit;
      border-bottom-right-radius: inherit;
    }

    &[labelposition="top"] {
      flex-direction: column-reverse;
      padding-top: 0px;
      
      i {
        position: inherit;
        font-size: .875rem;
        background-color: transparent;
      }
    }
`;

export const StyledLink = BaseButton(styled(Link));

export const StyledA = BaseButton(styled.a);

export const StyledButton = BaseButton(styled.button);
