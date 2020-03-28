import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import Disqus from "disqus-react"
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import StickyFooter from 'react-sticky-footer';
import Button from '@material-ui/core/Button';


function browseTo(history, state, county) {
    history.push(
        "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
        history.search,
    );
}

const useStyles = makeStyles(theme => ({
    qpContainer: {
        display: 'none',
        // color: '#FFFFFF',
        background: '#e3e3e3',
        borderWidth: "1px",
        padding: 15,
        margin: 15,
        // borderRadius: 20,
    },
}));

const SearchBox = (props) => {
    let summary = USCounty.getCountySummary1();
    let counties = summary.sort((a, b) => b.total - a.total)
        .map(c => {
            return {
                label: `${c.county} , ${c.state_name} (${c.total})`,
                value: c,
            };
        });
    return <Select
        className="basic-single"
        classNamePrefix="select"
        styles={{
            menu: provided => ({ ...provided, zIndex: 9999 })
        }}
        defaultValue={""}
        placeholder={"Search for a County"}
        isDisabled={false}
        isLoading={false}
        isClearable={true}
        isRtl={false}
        isSearchable={true}
        name="county_selection"
        options={counties}
        onChange={param => {
            console.log(param);
            if (props.callback) {
                if (param.value) {
                    props.callback(param.value.county, param.value.state_name);
                }
            }

        }}
    />;
}

const withHeader = (comp, props) => {

    const disqusShortname = "covid19direct";
    const disqusConfig = {
        url: "https://covid-19.direct",
        identifier: "article-id",
        title: "main page"
    };

    return (props) => {
        const classes = useStyles();
        let component = comp({
            // add addition things here
            ...props,
        });
        let footer = <div>
            <Typography variant="h5" noWrap>
                Discussions
                    </Typography>
            <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
            />
        </div>;

        let header = <header className="App-header">
            <Typography variant="h5" >
                COVID-19.direct
            </Typography>
            <SearchBox
                callback={(newcounty, newstate) => {
                    browseTo(props.history, newstate, newcounty);
                }}
            />

            <div className={classes.qpContainer}>
                <Typography variant="body1" >
                    Data Source changed. Please report errors in discussion section.
            </Typography>

            </div>

            {component }
            {footer}

            {/* TODO Comment out the following section until the donation pages are setup */}
            <StickyFooter
                bottomThreshold={0}
                normalStyles={{
                    display: "none",
                }}
                stickyStyles={{
                    backgroundColor: "rgba(255,255,255,.9)",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 2,
                }}
            >   
                <Button color="link"> Share </Button> 
                <Button color="link" onClick={() => {
                    const {history} = props;
                    history.push("/donate", history.search);
                }}> Support Us </Button>    
            </StickyFooter>
        </header>

        return header;
    }
};


export { withHeader }
