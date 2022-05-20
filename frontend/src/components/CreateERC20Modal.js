import React from "react";
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

class CreateERC20Modal extends React.Component {
    constructor( props ){
        super(props);

        this.state = {
            name: '',
            symbol: '',
            totalSupply: 999999
        };
    }

    onClose = () => {
        this.props.onClose(false)
    }

    onCreate = () => {
        this.props.onCreate({...this.state});
    }

    onChange =(fname) =>(event) => {
        const{value}=event.target;

        this.setState({
            [fname]:value
        });
    }

    render( ) {
        return (
            <Modal show={this.props.show} >
                <Modal.Header>
                    <Modal.Title>ERC20 Token</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="form-group">
                            <label htmlFor="tokenName">Name</label>
                            <input type="text" className="form-control" id="tokenName" aria-describedby="tokenName" placeholder="Name" value={ this.state.name } onChange={ this.onChange('name') }/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="tokenSymbol">Symbol</label>
                            <input type="text" className="form-control" id="tokenSymbol" aria-describedby="tokenSymbol" placeholder="Symbol" value={ this.state.symbol } onChange={ this.onChange('symbol') } />
                        </div>
                        <div className="form-group">
                            <label htmlFor="tokenSupply">Total Supply</label>            
                            <input type="text" className="form-control" id="tokenSupply" aria-describedby="tokenSupply" placeholder="Total tokens" value={ this.state.totalSupply } onChange={ this.onChange('totalSupply') }/>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.onClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={this.onCreate} >
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
};

export default CreateERC20Modal;



