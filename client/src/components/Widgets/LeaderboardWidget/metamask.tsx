import React from "react";
import { metamaskProps } from "../../../types/leaderboardTypes";
import { Theme, makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import Typography from "@material-ui/core/Typography";
import "../../css/leaderboard.css";
import metamask from "../../../assets/images//metamask.gif";
declare let web3: any;
declare let ethereum: any;
declare let Web3: any;

const image = {
  title: "Connect Metamask",
  width: "100%",
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    // minWidth: 5500,
    width: "100%",
    height: "100%",
  },
  image: {
    position: "relative",
    height: "100%",
    [theme.breakpoints.down("xs")]: {
      width: "100% !important", // Overrides inline-style
      height: 100,
    },
    "&:hover, &$focusVisible": {
      zIndex: 1,
      "& $imageBackdrop": {
        opacity: 0.15,
      },
      "& $imageMarked": {
        opacity: 0,
      },
      "& $imageTitle": {
        border: "4px solid currentColor",
      },
    },
  },
  focusVisible: {},
  imageButton: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.common.white,
  },
  imageSrc: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bottom: 0,
    backgroundSize: "cover",
    alignItems: "center",
    height: "100%",
  },
  imageBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.black,
    opacity: 0.4,
    transition: theme.transitions.create("opacity"),
  },
  imageTitle: {
    position: "relative",
    padding: `${theme.spacing(2)}px ${theme.spacing(4)}px ${
      theme.spacing(1) + 6
    }px`,
  },
  imageMarked: {
    height: 3,
    width: 18,
    backgroundColor: theme.palette.common.white,
    position: "absolute",
    bottom: -2,
    left: "calc(50% - 9px)",
    transition: theme.transitions.create("opacity"),
  },
}));

const MetamaskButton = (props: metamaskProps) => {
  const classes = useStyles();

  const connector = async () => {
    try {
      if (ethereum) {
        web3 = new Web3(ethereum);
        try {
          await ethereum.enable();
          web3.eth.getAccounts((err: string, accounts: string[]) => {
            if (err) console.log(err);
            else if (!accounts.length) alert("No Metamask accounts found");
            else {
              props.setAddress(accounts[0]);
              props.setConnection(true);
            }
          });
        } catch (e) {
          console.error("Error, ", e);
        }
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  return (
    <div className={classes.root}>
      <ButtonBase
        focusRipple
        key={image.title}
        className={classes.image}
        focusVisibleClassName={classes.focusVisible}
        style={{
          width: image.width,
        }}
        onClick={connector}
      >
        <img
          // alt={image.title}
          className={classes.imageSrc}
          // style={{
          //   backgroundImage: metamask,
          // }}
          src={metamask}
        />
        <span className={classes.imageBackdrop} />
        <span className={classes.imageButton}>
          <Typography
            component="span"
            variant="subtitle1"
            color="inherit"
            className={classes.imageTitle}
          >
            {image.title}
            <span className={classes.imageMarked} />
          </Typography>
        </span>
      </ButtonBase>
    </div>
  );
};

export default MetamaskButton;
