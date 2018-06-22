import styled from "styled-components";
import theme from "styles/theme";

import { Link } from "react-router-dom";
import { StyledHeaderH1 } from "components/augmint-ui/header/styles";

import { remCalc } from "styles/theme";

const TOP_NAV_HEIGHT = "60px";

export const StyledTopNav = styled.nav`
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid #ccc;
    height: ${TOP_NAV_HEIGHT}
    position: absolute;
    background-color: ${theme.colors.white};
    z-index: 103;
    top: 0;

    &.hide {
      display: none;
    }
`;

export const TitleWrapper = styled.div`
    margin-left: 200px;
    max-width: 60%;

    ${StyledHeaderH1} {
        font-size: ${remCalc("28")};
        margin: 0;
    }
`;

export const StyledTopNavUl = styled.ul`
    display: flex;
    justify-content: flex-end;
    margin: 0;
`;

export const StyledAccount = styled.div`
    display: none;
`;

export const StyledTopNavLi = styled.li`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${TOP_NAV_HEIGHT};

    &.account:hover ${StyledAccount} {
        display: block;
        position: absolute;
        right: 64px;
        top: ${TOP_NAV_HEIGHT};
    }
`;

export const StyledTopNavLink = styled(Link)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${TOP_NAV_HEIGHT};
    min-width: ${TOP_NAV_HEIGHT};
    padding: 0 2px;
    color: ${theme.colors.primary};
    transition: all ${theme.transitions.fast};
    transition-property: background-color, color;

    > i {
        font-size: 1.5rem;
        height: 1.5rem;
        width: 1.5rem;
    }

    &:hover {
        background-color: ${theme.colors.secondary};
        color: ${theme.colors.white};
    }
    &:hover span {
        color: ${theme.colors.white};
    }

    &:hover i {
        color: ${theme.colors.white};
    }
`;

export const StyledTopNavLinkRight = StyledTopNavLink.extend`
    display: flex;
    flex-direction: column;
    font-size: 11px;
`;

export const StyledPrice = styled.span`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    color: ${theme.colors.primary};
    padding: 0 20px;

    > .price {
        font-size: 1.125rem;
        color: ${theme.colors.secondary};
    }

    > .last-update {
        font-size: 0.75rem;
    }
`;
