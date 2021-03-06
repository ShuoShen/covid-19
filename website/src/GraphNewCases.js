import React from 'react';
import { Text, ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { DataCreditWidget } from './DataCredit';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { myShortNumber } from './Util';

const fileDownload = require('js-file-download');
const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
    grow: {
        flex: 1,
    }
}));

const CustomTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const today = moment().format("M/D");
        const { payload, label } = props;
        let confirmed;
        let newcase;
        let death;

        payload.map(p => {
            p = p.payload;
            if ("confirmed" in p) {
                confirmed = p.confirmed;
            }
            if ("pending_confirmed" in p) {
                confirmed = p.pending_confirmed;
            }
            if ("newcase" in p) {
                newcase = p.newcase;
            }
            if ("pending_newcase" in p) {
                newcase = p.pending_newcase;
            }
            if ("pending_death" in p) {
                death = p.pending_death;
            }
            if ("death" in p) {
                death = p.death;
            }
            return null;
        });

        let pending_help;
        if (today === payload[0].payload.name) {
            pending_help = "Last # potentially incomplete";
        }

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Confirmed: ${confirmed}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`New: ${newcase}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {pending_help}
                </Typography>
                <Typography variant="body2" noWrap>
                    Total Death: {death}
                </Typography>
            </div>
        );
    }
    return null;
}

const AntSwitch = withStyles(theme => ({
    root: {
        width: 28,
        height: 16,
        padding: 0,
        display: 'flex',
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        '&$checked': {
            transform: 'translateX(12px)',
            color: theme.palette.common.white,
            '& + $track': {
                opacity: 1,
                backgroundColor: "#00aeef",
                borderColor: theme.palette.primary.main,
                border: `0px solid ${theme.palette.grey[500]}`,
            },
        },
    },
    thumb: {
        width: 12,
        height: 12,
        boxShadow: 'none',
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        height: "auto",
        backgroundColor: theme.palette.common.white,
    },
    checked: {},
}))(Switch);

const BasicGraphNewCases = (props) => {

    const classes = useStyles();
    const [state, setState] = React.useState({
        showlog: false,
        show30days: false,
        plusNearby: false,
    });

    const [open, setOpen] = React.useState(false);
    const [openDownload, setOpenDownload] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleCloseDownload = () => {
        setOpenDownload(false);
    };

    const handleChange = event => {
        setState({ ...state, showlog: !state.showlog });
    };

    const handle30DaysToggle = event => {
        setState({ ...state, show30days: !state.show30days });
    };

    const handlePlusNearbyToggle = event => {
        setState({ ...state, plusNearby: !state.plusNearby });
        props.onPlusNearby(event);
    };

    let data = props.data;
    data = data.map(d => {
        d.name = moment(d.fulldate).format("M/D");
        return d;
    });

    // const showPlusNearby = typeof(props.onPlusNearby) !== 'undefined';
    const showPlusNearby = false;
    let plusNearbyDiv = <></>;
    if (showPlusNearby) {
        plusNearbyDiv = <><Grid item></Grid>
            <Grid item>
                <AntSwitch checked={state.plusNearby} onClick={handlePlusNearbyToggle} />
            </Grid>
            <Grid item onClick={handlePlusNearbyToggle}>+Nearby</Grid></>;
    }

    let newdata = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (i === 0) {
            item.newcase = data[i].confirmed;
        } else {
            item.newcase = data[i].confirmed - data[i - 1].confirmed;
        }
        newdata.push(item)
    }
    data = newdata;

    if (data.length > 2) {
        let newdata = data.slice(0, data.length - 2);
        let second_last = data[data.length - 2];
        let last = data[data.length - 1];
        second_last.pending_confirmed = second_last.confirmed;
        second_last.pending_newcase = second_last.newcase;
        second_last.pending_death = second_last.death;
        let newlast = {
            name: last.name,
            pending_confirmed: last.confirmed,
            pending_newcase: last.newcase,
            pending_death: last.death,
        };
        newdata.push(second_last);
        newdata.push(newlast);
        data = newdata;
    }

    if (state.show30days) {
        const cutoff = moment().subtract(14, 'days')
        data = data.filter(d => {
            return moment(d.fulldate).isAfter(cutoff)
        });
    } else {

        const cutoff = moment().subtract(30, 'days')
        data = data.filter(d => {
            return moment(d.fulldate).isAfter(cutoff)
        });
    }

    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem);
    }

    data = data.sort((a, b) => moment(a.fulldate).isAfter(moment(b.fulldate)));

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item></Grid>
            <Grid item>
                <AntSwitch checked={state.showlog} onClick={handleChange} />
            </Grid>
            <Grid item onClick={handleChange}>
                <Typography>
                    Log Scale
        </Typography>
            </Grid>
            <Grid item></Grid>
            <Grid item>
                <AntSwitch checked={state.show30days} onClick={handle30DaysToggle} />
            </Grid>
            <Grid item onClick={handle30DaysToggle}>
                <Typography>
                    Last 2 weeks
        </Typography>
            </Grid>
            {plusNearbyDiv}
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle id="alert-dialog-title">{"Data Credit"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <DataCreditWidget></DataCreditWidget>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary" autoFocus>
                        OK
          </Button>
                </DialogActions>
            </Dialog>
            <Grid item></Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <Text textAnchor={"start"} verticalAnchor={"start"} > hello</Text>
                <Tooltip content={<CustomTooltip />} />
                <XAxis dataKey="name" />
                {
                    state.showlog ?
                        <YAxis yAxisId={0} scale={scale} /> :
                        <YAxis tickFormatter={formatYAxis} />
                }

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} strokeWidth={3} />

                <Line type="monotone" dataKey="pending_death" stroke="#000000" strokeDasharray="1 1" strokeWidth={3} />
                <Line type="monotone" dataKey="pending_confirmed" stroke="#ff7300" strokeDasharray="1 1" strokeWidth={3} />
                <Line type="monotone" dataKey="pending_newcase" stroke="#387908" strokeDasharray="1 1" strokeWidth={3} /> */}

                <Legend verticalAlign="top" payload={[
                    { value: 'Total ', type: 'line', color: '#ff7300' },
                    { value: 'New Cases', type: 'line', color: '#389708' },
                    { value: 'Death', type: 'line', color: '#000000' },
                ]} />

            </LineChart></ResponsiveContainer>
        <Grid container alignItems="center" spacing={1}>
            <Grid item onClick={handleClickOpen} >
                <Typography variant="body2" noWrap>
                    Data Credit: Click for details.
        </Typography>
            </Grid>
            <Grid item>
            </Grid>
            <Grid item className={classes.grow} />
            <Grid item onClick={
                () => {
                    fileDownload(JSON.stringify(data, 2, 2), "covid-data.json");
                    setOpenDownload(true);
                }
            }>
                <Typography variant="body2" noWrap>
                    Data Download
        </Typography>
            </Grid>
            <Dialog
                open={openDownload}
                onClose={handleCloseDownload}
            >
                <DialogTitle id="alert-dialog-title">{"Download Complete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Disclaimer: The format data likely to change over time.
                        </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDownload} color="primary" autoFocus>
                        OK
          </Button>
                </DialogActions>
            </Dialog>


            <Grid item></Grid>
        </Grid>
    </>
}

export { BasicGraphNewCases };
